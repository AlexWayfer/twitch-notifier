import { Twitch } from './twitch'
import { Channel } from '../models/Channel'
import { chunk, flattenDeep } from 'lodash'
import { config } from '../helpers/config'
import { notifyAboutOnline, notifyAboutChange } from './sender'

const twitch = new Twitch(config.twitch.clientId)

async function check () {
  setTimeout(() => check(), 5 * 60 * 1000)
  const dbChannels = await Channel.findAll()
  const onlineChannels = flattenDeep(await getOnlineStreams(dbChannels.map(o => o.id)))

  for (let dbChannel of dbChannels) {
    const channel = onlineChannels.find(o => Number(o.user_id) === dbChannel.id)

    if (channel && !dbChannel.online) { // twitch channel online, but offline in db => do notify
      await dbChannel.update({ online: true, game: channel.game })
      notifyAboutOnline(dbChannel.id)
    } else if (!channel && dbChannel.online) { // if channel offline on twtch but online in db, then set channel as offline in db
      await dbChannel.update({ online: false })
    } else if (channel && dbChannel.online && channel.game !== dbChannel.game) {
      notifyAboutChange(dbChannel.id, channel.game)
      await dbChannel.update({ game: (await twitch.getStreamMetaData(dbChannel.id)).game })
    } else if (channel && dbChannel.online) { // skip if twitch channel online and online in db
      continue
    } else await dbChannel.update({ online: false }) // set channel in db as offline
  }
}
check()

async function getOnlineStreams(channels: number[]) {
  let onlineChannels: any[] = []
  const chunks = chunk(channels, 100)
  for (const chunk of chunks) {
    onlineChannels.push((await twitch.checkOnline(chunk)))
  }
  return onlineChannels
}


import { config } from '../helpers/config'
import VkService from '../messengers/vk'
import TelegramService from '../messengers/telegram'
import { Op } from 'sequelize'
import { User } from '../models/User'
import { Twitch, StreamMetadata } from './twitch'
import { error } from '../helpers/logs'

const spaceRegexp = /^\s*$/
const twitch = new Twitch(config.twitch.clientId)

export const notifyAboutOnline = async (streamerId: number) => {
  try {
    const streamMetaData = await twitch.getStreamMetaData(streamerId)
    sendVk(streamMetaData)
    sendTelegram(streamMetaData)
  } catch (e) {
    error(e)
  }
}

const sendVk = async (streamMetaData: StreamMetadata) => {
  const photo = await VkService.uploadPhoto(streamMetaData.preview.template.replace('{width}', '1280').replace('{height}', '720'))
  const game = streamMetaData.game ? `Игра: ${streamMetaData.game}\n` : ''
  const title = spaceRegexp.test(streamMetaData.channel.status) ? '' : `Название стрима: ${streamMetaData.channel.status}\n`
  const users = (await User.findAll({ 
    where: { follows: { [Op.contains]: [Number(streamMetaData.channel._id)] }, service: 'vk' },
    raw: true
  })).map(o => o.id)
  const message = `${streamMetaData.channel.display_name} онлайн!\n${game}${title}https://twitch.tv/${streamMetaData.channel.name}`
  await VkService.sendMessage({ target: users, message, image: photo.toString() })
}

const sendTelegram = async (streamMetaData: StreamMetadata) => {
  const game = streamMetaData.game ? `Game: ${streamMetaData.game}\n` : ''
  const title = spaceRegexp.test(streamMetaData.channel.status) ? '' : `Title: ${streamMetaData.channel.status}\n`
  const preview = streamMetaData.preview.template.replace('{width}', '1280').replace('{height}', '720')
  const users = (await User.findAll({ 
    where: { follows: { [Op.contains]: [Number(streamMetaData.channel._id)] }, service: 'telegram' },
    raw: true
  })).map(o => o.id)
  const message = `${streamMetaData.channel.display_name} online!\n${game}${title}https://twitch.tv/${streamMetaData.channel.name}`
  TelegramService.sendMessage({ target: users, message, image: `${preview}?timestamp=${Date.now()}` })
}

export const notifyAboutChange = async (streamerId: number, oldGame: string) => {
  const streamMetaData = await twitch.getStreamMetaData(streamerId)

  const users = (await User.findAll({ 
    where: { subscriptions: { [Op.contains]: ['gameChange'] } },
    raw: true
  })).map(o => ({ id: o.id, service: o.service }))

  VkService.sendMessage({ 
    target: users.filter(o => o.service === 'vk').map(o => o.id), 
    message: `Игра ${streamMetaData.channel.display_name} изменилась с ${oldGame} на ${streamMetaData.game}`
  })

  TelegramService.sendMessage({ 
    target: users.filter(o => o.service === 'telegram').map(o => o.id), 
    message: `Game ${streamMetaData.channel.display_name} changed from ${oldGame} to ${streamMetaData.game}`
  })
}
import { VkBot } from 'nodejs-vk-bot'
import { info, error } from '../helpers/logs'
import { Twitch } from './twitch'
import { User } from '../models/User'
import { config } from '../helpers/config'
import { remove } from 'lodash'

const bot = new VkBot(config.vk.token)
const twitch = new Twitch(config.twitch.clientId)

bot.command(['!подписка'], async (ctx) => {
  const [user] = await User.findOrCreate({ where: { id: ctx.message.from_id }, defaults: { follows: [] } })
  const argument: string = ctx.message.text.split(' ')[1]
  if (!argument) {
    return ctx.reply('Вы должны указать на кого подписаться.')
  }
  try {
    const streamer = await twitch.getChannel(argument)
    if (user.follows.includes(streamer.id)) {
      return ctx.reply(`Вы уже подписаны на ${streamer.displayName}.`)
    } else {
      user.follows.push(streamer.id)
      await user.update({ follows: user.follows })
      await ctx.reply(`Вы успешно подписались на ${streamer.displayName}!\nЧто бы отписаться напишите: !отписка ${streamer.displayName}`)
    }
  } catch (e) {
    error(e)
    ctx.reply(e.message)
  }
})

bot.command(['!отписка'], async (ctx) => {
  const user = await User.findOne({ where: { id: ctx.message.from_id } })
  if (!user) {
    return ctx.reply('В данный момент вы ни на кого не подписаны.')
  }
  const argument: string = ctx.message.text.split(' ')[1]
  if (!argument) {
    return ctx.reply('Вы должны указать от кого отписаться.')
  }
  try {
    const streamer = await twitch.getChannel(argument)
    if (!user.follows.includes(streamer.id)) {
      return ctx.reply(`Вы не подписаны на канал ${streamer.displayName}.`)
    } else {
      remove(user.follows, (o: number) => o === streamer.id)
      await user.update({ follows: user.follows })
      await ctx.reply(`Вы успешно отписались от ${streamer.displayName}.`)
    }
  } catch (e) {
    error(e)
    ctx.reply(e.message)
  }
})

bot.command(['!подписки'], async (ctx) => {
  const user = await User.findOne({ where: { id: ctx.message.from_id } })
  if (!user.follows.length) {
    return ctx.reply('В данный момент вы ни на кого не подписаны.')
  } else {
    const channels = await twitch.getChannelsById(user.follows)
    const follows = channels.map(o => o.displayName).join(', ')
    ctx.reply(`Вы подписаны на: ${follows}`)
  }
})

export function say(userId: number | number[], message: string, attachment: string) {
  bot.sendMessage(userId, message, attachment)
} 

bot.startPolling().then(() => {
  info('VK bot connected.')
})

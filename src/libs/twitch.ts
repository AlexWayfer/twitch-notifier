import axios, { AxiosInstance } from 'axios'
import { error, info } from '../helpers/logs'

export default new class Twitch {
  helix: AxiosInstance
  kraken: AxiosInstance
  token: string
  clientId: string
  inited: boolean

  constructor() {
    this.init()
  }

  private async init() {
    info('Initiliazing twitch class')
    const request = await axios.get(`http://auth.satont.ru/refresh?refresh_token=${process.env.TWITCH_REFRESHTOKEN}`)
      .catch(error)
    this.token = request ? request.data.token : null

    const validateRequest = await axios.get(`https://id.twitch.tv/oauth2/validate`, { headers: { Authorization: `OAuth ${this.token}` } })
      .catch(error)

    this.clientId = validateRequest ? validateRequest.data.client_id : null

    if (!this.clientId || !this.token) {
      error(`Cannot init twitch class, ${this.token}, ${this.clientId}`)
    }
    this.helix = axios.create({
      baseURL: 'https://api.twitch.tv/helix/',
      headers: {
        'Client-ID': this.clientId,
        'Authorization': `Bearer ${this.token}`
      },
    })

    this.kraken = axios.create({
      baseURL: 'https://api.twitch.tv/kraken/',
      headers: {
        'Accept': 'application/vnd.twitchtv.v5+json',
        'Client-ID': this.clientId,
        'Authorization': `OAuth ${this.token}`
      },
    })
    info('Bot token refreshed and validated')
    this.inited = true
  }

  public async getChannel(channelName: string): Promise<{id: number, login: string, displayName: string}> {
    try {
      const request = await this.kraken.get(`users?login=${channelName}`)
      const response = request.data
      if (!response.users.length) throw new Error(`Channel ${channelName} not found.`)
      else return { id: Number(response.users[0]._id), login: response.users[0].name, displayName: response.users[0].display_name }
    } catch (e) {
      error(e)
    }
  }

  public async getChannelsById(channels: number[]): Promise<[{ id: number, displayName: string, login: string }]> {
    try {
      const request = await this.kraken.get(`users?id=${channels.join('&id=')}`)
      return request.data.users.map(o => { return { id: Number(o._id), displayName: o.display_name, login: o.name } })
    } catch (e) {
      error(e)
    }
  }

  public async checkOnline (channels: number[]) {
    try {
      const request = await this.kraken.get(`streams?first=100&channel=${channels.join('&channel=')}`)
      return request.data.streams
    } catch (e) {
      error(e)
    }
  }

  public async getStreamMetaData(id: number): Promise<StreamMetadata> {
    try {
      const { data } = await this.kraken.get(`streams/${id}`)
      return data.stream
    } catch (e) {
      error(e)
    }
  }

  public async getUsers(ids: number[]): Promise<any> {
    try {
      const { data } = await this.helix.get(`users?id=${ids.join('&id=')}`)
      return data.data
    } catch (e) {
      error(e)
    }
  }
}

export type StreamMetadata = {
  game: null | string,
  channel: {
    display_name: string,
    name: string,
    status: string,
    _id: number,
  }
  preview: {
    template: string,
  }
}

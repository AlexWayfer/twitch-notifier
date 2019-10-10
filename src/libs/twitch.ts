import axios from 'axios'
import { info } from '../helpers/logs'

export enum Methods {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE'
}

interface TwitchError {
  status: string,
  message: string,
}

interface Request {
  method: Methods,
  endpoint: string,
  data?: object,
}

export class Twitch {
  clientId: string = ''
  baseUrl: string = 'https://api.twitch.tv/helix/'

  constructor(clientId: string) {
    this.clientId = clientId
  }

  public async request (options: Request) {
    let query: any;
    const url: string = `${this.baseUrl}${options.endpoint}`
    try {
      query = await axios({
        method: options.method,
        url,
        data: options.data || {},
        headers: {
          'Client-ID': this.clientId
        }
      })
      return query
    } catch (e) {
      const twitchError: boolean = Boolean(e.response.data)
      const twitchData: TwitchError = e.response.data

      const errorMessage: string = twitchError ? `${twitchData.status} — ${twitchData.message}` : `${e.response.status} — ${e.response.statusText}`
      throw new Error(`Error on request ${options.method} ${url}, body of error: ${errorMessage}`)
    }
  }

  public async getChannel(channelName: string) {
    
  }

}
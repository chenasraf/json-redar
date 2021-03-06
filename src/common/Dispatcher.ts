import { Dispatcher } from 'flux'
import { ReduceStore } from 'flux/utils'
import * as Immutable from 'immutable'
import axios, { AxiosResponse } from 'axios'
import * as Headers from 'common/Headers'
import * as Payload from 'common/Payload'
import { compileCode } from 'common/Trasformer'

const ActionTypes = {
  SEND_REQUEST: 'SEND_REQUEST',
  UPDATE_RESPONSE: 'UPDATE_RESPONSE',
  UPDATE_VIEWKEY: 'UPDATE_VIEWKEY',
  UPDATE_REQ_TYPE: 'UPDATE_REQ_TYPE',
  UPDATE_REQ_PAYLOAD: 'UPDATE_REQ_PAYLOAD',
  UPDATE_REQ_METHOD: 'UPDATE_REQ_METHOD',
  UPDATE_REQ_HEADERS: 'UPDATE_REQ_HEADERS',
  UPDATE_REQ_URL: 'UPDATE_REQ_URL',
  UPDATE_RES_TRANSFORM: 'UPDATE_RES_TRANSFORM',
  UPDATE_RES_TRANSFORM_ERROR: 'UPDATE_RES_TRANSFORM_ERROR',
}

const StoreKeys = {
  Response: 'RESPONSE',
  ViewKey: 'VIEWKEY',
  RequestType: 'REQ_TYPE',
  RequestPayload: 'REQ_PAYLOAD',
  RequestMethod: 'REQ_METHOD',
  RequestHeaders: 'REQ_HEADERS',
  RequestURL: 'REQ_URL',
  ResponseTransform: 'RES_TRANSFORM',
  ResponseTransformError: 'RES_TRANSFORM.ERROR',
}

export type TActionName = 
'SEND_REQUEST' | 'UPDATE_RESPONSE' | 'UPDATE_VIEWKEY' | 'UPDATE_REQ_TYPE' | 'UPDATE_REQ_PAYLOAD' | 
'UPDATE_REQ_METHOD' | 'UPDATE_REQ_HEADERS' | 'UPDATE_REQ_URL' | 'UPDATE_RES_TRANSFORM'

export interface IAction<T = any> {
  name: TActionName | string,
  payload?: T
}

export const AppDispatcher = new Dispatcher<IAction>()

function innerObjFromKey<T = any>(obj: T, k: string): Immutable.Map<string, T> {
  return Immutable.Map<string, any>(obj || {}).get(k, {})
}

export type IState = Immutable.Map<string, any>

class AppStore extends ReduceStore<IState, IAction> {
  constructor() {
    super(AppDispatcher)
  }

  getInitialState() {
    return Immutable.Map<string, any>([
      [StoreKeys.ViewKey, localStorage.lastViewKey || ''],
      [StoreKeys.RequestType, localStorage.lastRequestType || 'JSON'],
      [StoreKeys.RequestMethod, localStorage.lastMethod || 'GET'],
      [StoreKeys.RequestPayload, localStorage.lastPayload || '""'],
      [StoreKeys.RequestURL, localStorage.lastURL || ''],
      [StoreKeys.RequestHeaders, Headers.parseHeaderList(localStorage.lastHeaders || '')],
      [StoreKeys.ResponseTransform, localStorage.lastResTransform || ''],
    ])
  }

  reduce(state: IState, action: IAction) {
    switch (action.name) {
      case ActionTypes.UPDATE_RESPONSE:
        let viewKey = state.get(StoreKeys.ViewKey)
        let response = action.payload
        state = state.set(StoreKeys.ResponseTransformError, '')

        if (localStorage.lastViewKey !== '' && response && !response.hasOwnProperty(viewKey)) {
          viewKey = this.getViewKey(response)
          state = state.set(StoreKeys.ViewKey, viewKey)
        }
        
        return state.set(StoreKeys.Response, response)
      case ActionTypes.UPDATE_VIEWKEY:
        localStorage.lastViewKey = action.payload
        return state.set(StoreKeys.ViewKey, action.payload)
      case ActionTypes.UPDATE_REQ_HEADERS:
        localStorage.lastHeaders = Headers.stringHeaders(action.payload)
        return state.set(StoreKeys.RequestHeaders, action.payload)
      case ActionTypes.UPDATE_REQ_URL:
        localStorage.lastURL = action.payload
        return state.set(StoreKeys.RequestURL, action.payload)
      case ActionTypes.UPDATE_REQ_METHOD:
        localStorage.lastMethod = action.payload
        return state.set(StoreKeys.RequestMethod, action.payload)
      case ActionTypes.UPDATE_REQ_PAYLOAD:
        localStorage.lastPayload = action.payload
        return state.set(StoreKeys.RequestPayload, action.payload)
      case ActionTypes.UPDATE_RES_TRANSFORM:
        localStorage.lastResTransform = action.payload
        return state.set(StoreKeys.ResponseTransform, action.payload)
      case ActionTypes.UPDATE_RES_TRANSFORM_ERROR:
        return state.set(StoreKeys.ResponseTransformError, action.payload)
      case ActionTypes.SEND_REQUEST:
        if (!action.payload) {
          action.payload = {
            url: state.get(StoreKeys.RequestURL),
            method: state.get(StoreKeys.RequestMethod),
            data: Payload.parsePayload(state.get(StoreKeys.RequestPayload), state.get(StoreKeys.RequestType)),
            headers: 
              Headers.headerListToObject(state.get(StoreKeys.RequestHeaders, Immutable.List<[string, string]>())),
          }
        }
        axios.request(action.payload)
          .then((resp: AxiosResponse) => {
            dispatch(ActionTypes.UPDATE_RESPONSE, resp.data)
          })
        return state
      default:
        return state
    }
  }

  private getViewKey(data: any) {
    for (const k in data) {
      if (data.hasOwnProperty(k) && data[k] && data[k].constructor === Array) {
        return k
      }
    }
    
    return ''
  }
}

export function dispatch(name: TActionName | string, payload: any) {
  AppDispatcher.dispatch({ name, payload })
}

function register(name: TActionName | string, callback: (payload: any) => void): string {
  return AppDispatcher.register((payload: IAction) => {
    if (payload.name === name) {
      console.debug('Dispatching:', payload.name, payload.payload)
      callback(payload.payload)
    }
  })
}

const Store = new AppStore()
export default AppDispatcher
export { Store, ActionTypes, StoreKeys, AppDispatcher as Dispatcher, register }

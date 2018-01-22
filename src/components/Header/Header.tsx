import * as React from 'react'
import * as css from './Header.css'
import * as I from './Header.module'
import AddressBar from 'components/AddressBar/AddressBar'
import RequestType from 'components/RequestType/RequestType'
import SelectBox, { Option, styles as selectBoxStyle } from 'components/SelectBox/SelectBox'
import Button from 'components/Button/Button'
import axios, { AxiosResponse } from 'axios'
import { dispatch, register, ActionTypes, StoreKeys } from 'common/Dispatcher'
import * as classNames from 'classnames'

class Header extends React.Component<I.IProps, I.IState> {  
  private httpMethods = [
    { label: 'GET', value: 'GET' },
    { label: 'POST', value: 'POST' },
    { label: 'PUT', value: 'PUT' },
    { label: 'DELETE', value: 'DELETE' },
  ] as Array<Option<string>>

  constructor(props: I.IProps) {
    super(props)
    this.state = {
      url: localStorage.lastUrl || '',
      method: localStorage.lastMethod || 'GET',
      requestPayload: localStorage.lastRequestPayload || '',
      headers: localStorage.lastHeaders || '',
    }
  }

  public componentDidMount() {
    if (this.state.url.length) {
      this.go()
    }
  }

  private changeURL(url: string) {
    this.setState({ url })
    localStorage.lastUrl = url
  }
  
  private changeMethod(method: string) {
    this.setState({ method })
    localStorage.lastMethod = method
  }
  
  private changeRequestPayload(requestPayload: string) {
    this.setState({ requestPayload })
    localStorage.lastRequestPayload = requestPayload
  }

  private changeHeaders(headers: string) {
    this.setState({ headers })
    localStorage.lastHeaders = headers
  }

  private get requestHeaders() {
    const headers = this.state.headers.split(`\n`).reduce((accu, cur) => {
      const [key, val] = cur.split(':').map(s => s.trim())
      if (key.length) {
        accu[key] = val
      }
      return accu
    }, {})

    return headers
  }

  private go() {
    const { method, url: url } = this.state
    dispatch(ActionTypes.SEND_REQUEST, {
      method, url,
      data: this.state.requestPayload,
      headers: this.requestHeaders
    })
  }

  render() {
    return (
      <div className={classNames(css.header, this.props.className)}>
        <div className={css.nav}>
          <div className={css.method}>
            <SelectBox name="method"
              className={selectBoxStyle.selectBox}
              value={this.state.method}
              options={this.httpMethods}
              placeholder="METHOD"
              onChange={(value: Option<string>) => this.changeMethod(value.value!)}
              />
          </div>
          <div className={css.address}>
            <AddressBar url={this.state.url}
              handleChange={(value) => this.changeURL(value)}/>
          </div>
          <div className={css.go}>
            <Button onClick={() => this.go()}>Go</Button>
          </div>
        </div>
        <div className={css.requestDataContainer}>
          <RequestType className={css.payload}
            onChange={(payload) => this.setState({ requestPayload: payload })}
            store={this.props.store} />
          <div className={css.headers}>
            <h4 className={css.title}>Headers</h4>
            <textarea name="headers"
              value={this.state.headers}
              placeholder="Headers"
              onChange={(e) => this.changeHeaders(e.target.value)} />
          </div>
        </div>
      </div>
    )
  }
}

export default Header

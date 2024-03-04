import ky from 'ky'
import { Component, render } from 'preact'
import './index.sass'

const consumer_key = import.meta.env.VITE_CONSUMER_KEY
const redirect_uri = window.location.origin

const api = ky.create({
  headers: { 'X-Accept': 'application/json', Accept: '*/*' },
})
;(async () => {
  if (!localStorage.getItem('access_token')) {
    const params = new URLSearchParams(window.location.search)
    if (!params.has('code')) {
      const json = await api.post('/pocket/oauth/request', { json: { consumer_key, redirect_uri } }).json()
      window.location.href = `https://getpocket.com/auth/authorize?request_token=${json.code}&redirect_uri=${redirect_uri}?code=${json.code}`
    }

    const json = await api.post('/pocket/oauth/authorize', { json: { consumer_key, code: params.get('code') } }).json()
    localStorage.setItem('access_token', json.access_token)
    window.history.replaceState('', '', window.location.pathname)
  }

  const access_token = localStorage.getItem('access_token')

  // eslint-disable-next-line no-unused-vars
  class App extends Component {
    constructor() {
      super()
      this.state = {
        items: [],
      }
    }

    async componentDidMount() {
      const json = await api.post('/pocket/get', { json: { consumer_key, access_token } }).json()
      const items = Object.values(json.list).sort((a, b) => {
        return a.sort_id - b.sort_id
      })
      this.setState({ items })
    }

    async handleClick(index, item_id) {
      await api
        .post('/pocket/send', { json: { consumer_key, access_token, actions: [{ action: 'archive', item_id }] } })
        .json()
      this.setState({
        items: this.state.items.filter((_, i) => {
          return i !== index
        }),
      })
    }

    render() {
      // eslint-disable-next-line no-unused-vars
      const Loading = () => {
        return (
          <div class="modal is-active">
            <div class="modal-background" />
            <div class="modal-content">
              <a class="button is-loading is-centered" />
            </div>
          </div>
        )
      }

      const list = this.state.items.map((item, index) => {
        return (
          <a
            className="panel-block"
            href={item.given_url}
            onClick={() => this.handleClick(index, item.item_id)}
            key={item.item_id}
          >
            {item.given_title || item.given_url}
          </a>
        )
      })

      return (
        <div className="container">
          {this.state.items.length === 0 ? <Loading /> : <div className="panel">{list}</div>}
        </div>
      )
    }
  }

  render(<App />, document.body, document.querySelector('#app'))
})()

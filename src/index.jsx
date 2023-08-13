/* eslint-disable camelcase */
import axios from 'axios';
import { Component, render } from 'preact';
import './index.sass';

const consumer_key = import.meta.env.VITE_CONSUMER_KEY;
const redirect_uri = window.location.origin;

axios.defaults.headers.post['X-Accept'] = 'application/json';

(async () => {
  if (!localStorage.getItem('access_token')) {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('code')) {
      const response = await axios.post('/pocket/oauth/request', { consumer_key, redirect_uri });
      window.location.href = `https://getpocket.com/auth/authorize?request_token=${response.data.code}&redirect_uri=${redirect_uri}?code=${response.data.code}`;
    }

    const response = await axios.post('/pocket/oauth/authorize', { consumer_key, code: params.get('code') });
    localStorage.setItem('access_token', response.data.access_token);
    window.history.replaceState('', '', window.location.pathname);
  }

  const access_token = localStorage.getItem('access_token');

  class App extends Component {
    constructor() {
      super();
      this.state = {
        items: [],
      };
    }

    async componentDidMount() {
      const response = await axios.post('/pocket/get', { consumer_key, access_token });
      const items = Object.values(response.data.list).sort((a, b) => {
        return a.sort_id - b.sort_id;
      });
      this.setState({ items });
    }

    async handleClick(index, item_id) {
      await axios.post('/pocket/send', { consumer_key, access_token, actions: [{ action: 'archive', item_id }] });
      this.setState({
        items: this.state.items.filter((_, i) => {
          return i !== index;
        }),
      });
    }

    render() {
      const Loading = () => {
        return (
          <div class="modal is-active">
            <div class="modal-background" />
            <div class="modal-content">
              <a class="button is-loading is-centered" />
            </div>
          </div>
        );
      };

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
        );
      });

      return (
        <div className="container">
          {this.state.items.length === 0 ? <Loading /> : <div className="panel">{list}</div>}
        </div>
      );
    }
  }

  render(<App />, document.body, document.querySelector('#app'));
})();

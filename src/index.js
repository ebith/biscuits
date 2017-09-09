import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import List, { ListItem, ListItemText } from 'material-ui/List';
import Divider from 'material-ui/Divider';

import * as popsicle from 'popsicle';
import sortBy from 'lodash.sortby';

const consumerKey = process.env.REACT_APP_CONSUMER_KEY;
const redirectUri = process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/` : 'http://localhost:3000/';
let accessToken;

class App extends Component {
  render() {
    return (
      <div className="App">
        <Biscuits />
      </div>
    );
  }
}

class Biscuits extends Component {
  constructor(props) {
    super(props);
    this.state = {'list': {}};

    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has('code')) {
      popsicle.request({
        method: 'POST',
        url: `${process.env.REACT_APP_BASE_URL}/oauth/authorize`,
        body: {
          consumer_key: consumerKey,
          code: searchParams.get('code'),
        },
      }).use(popsicle.plugins.parse('urlencoded'))
        .then((response) => {
          accessToken = response.body.access_token;
          window.history.replaceState('', '', window.location.pathname);

          popsicle.request({
            method: 'POST',
            url: `${process.env.REACT_APP_BASE_URL}/get`,
            body: {
              consumer_key: consumerKey,
              access_token: accessToken,
            },
          }).use(popsicle.plugins.parse('json'))
            .then((response2) => {
              this.setState({'list': sortBy(response2.body.list, (item) => { return item.sort_id })});
            });
      });
    } else {
      popsicle.request({
        method: 'POST',
        url: `${process.env.REACT_APP_BASE_URL}/oauth/request`,
        body: {
          consumer_key: consumerKey,
          redirect_uri: redirectUri,
        },
      }).use(popsicle.plugins.parse('urlencoded'))
        .then((response) => {
          window.location.href = `https://getpocket.com/auth/authorize?request_token=${response.body.code}&redirect_uri=${redirectUri}?code=${response.body.code}`;
      });
    }
  }

  eat(index){
    this.state.list.splice(index, 1);
    this.setState({list: this.state.list});
  }

  render(props) {
    const listItems = Array.from(Object.values(this.state.list), (item, index) => {
      return (
        <div key={item.item_id}>
          <ListItem button component="a" href={item.given_url} onClick={(event) => this.eat(index)}>
            <ListItemText primary={item.given_title || item.given_url} />
          </ListItem>
          <Divider />
        </div>
      );
    });
    return (
      <List>{listItems}</List>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));

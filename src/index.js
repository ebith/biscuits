import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import 'grommet/grommet.min.css';
import App from 'grommet/components/App';
import Box from 'grommet/components/Box';
import List from 'grommet/components/List';
import ListItem from 'grommet/components/ListItem';
import Spinning from 'grommet/components/icons/Spinning';
import Label from 'grommet/components/Label';

import * as popsicle from 'popsicle';
import 'url-search-params-polyfill';
import values from 'object.values';
import sortBy from 'lodash.sortby';

if (!Object.values) { values.shim(); }

const consumerKey = process.env.REACT_APP_CONSUMER_KEY;
const redirectUri = process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/` : 'http://localhost:3000/';
let accessToken;

class Biscuits extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      list: {},
    };

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
              this.setState({list: sortBy(response2.body.list, (item) => { return item.sort_id })});
              this.setState({loading: false});
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

  eat(index, id){
    popsicle.request({
      method: 'POST',
      url: `${process.env.REACT_APP_BASE_URL}/send`,
      body: {
        consumer_key: consumerKey,
        access_token: accessToken,
        actions: [{action: 'archive', item_id: id}]
      },
    }).use(popsicle.plugins.parse('json'))
      .then((response) => {
        console.log(response.body);
        this.state.list.splice(index, 1);
        this.setState({list: this.state.list});
      });
  }

  render(props) {
    const listItems = Array.from(Object.values(this.state.list), (item, index) => {
      return (
        <ListItem onClick={(event) => this.eat(index, item.item_id)} key={item.item_id}>
          <a href={item.given_url}>{item.given_title || item.given_url}</a>
        </ListItem>
      );
    });

    if (this.state.loading) {
      return (
        <Label align="center">
          <Spinning size="xlarge"/>
          <div>Loading...</div>
        </Label>
      );
    } else {
      return (
        <List>{listItems}</List>
      );
    }
  }
}

ReactDOM.render(
  <App>
    <Box full={true}>
      <Biscuits />
    </Box>
  </App>
  , document.getElementById('root'));

import xs from 'xstream'
import switchPath from 'switch-path'
import Cycle from '@cycle/xstream-run'
import { makeHTTPDriver } from '@cycle/http'
import { makeRouterDriver } from 'cyclic-router'
import { makeCookieDriver } from 'cyclejs-cookie'
import { div, nav, h1, a, ul, li, makeDOMDriver } from '@cycle/dom'
import { createHistory } from 'history'

// Components
import HomeComponent from './components/home'
import MissingComponent from './components/missing'
require('./main.scss')

// Webpack hot reload plugin
if (module.hot) {
  module.hot.accept()
}

function LoginComponent () {
  return {
    DOM: xs.of(div([
      h1('Please log in')
    ]))
  }
}

const main = sources => {
  const match$ = sources.router.define({
    '/home': HomeComponent,
    '/login': LoginComponent,
    '*': MissingComponent
  })

  const page$ = match$.map(({path, value}) => value(Object.assign({}, sources, {
    router: sources.router.path(path)
  })))

  // Get sinks from all components
  const view$ = page$.map(v => v.DOM || xs.never()).flatten()
  const http$ = page$.map(v => v.HTTP || xs.never()).flatten()
  const route$ = page$.map(v => v.router || xs.never()).flatten()

  // Check authentication
  const cookie$ = sources.cookie.get('userid').startWith(null)

  const auth$ = cookie$
    .map(authenticated => authenticated ? '/home' : '/login')

  // Create a main page

  // Navigation bar
  const nav$ = cookie$.map(authenticated => authenticated
    ? nav('.navbar .navbar-fixed-top .navbar-dark .bg-inverse', [
      h1('.navbar-brand', 'express-webpack-cycle-boilerplate'),
      ul('.nav .navbar-nav', [
        li('.nav-item', [a('.home .nav-link', { href: '#' }, 'Home')])
      ])
    ])
    : null)

  const navHomeClick$ = sources.DOM.select('.home').events('click')

  // Wrap component DOM inside a main container DOM
  const vdom$ = xs.combine(nav$, view$).map(([navDOM, viewDOM]) => {
    // Main view container
    const bodyDOM = div('.container .mt-2', [viewDOM])
    return div([navDOM, bodyDOM])
  })

  // Create router sink
  const router$ = xs.merge(
    auth$,
    navHomeClick$.mapTo('/home'),
    route$
  )

  const sinks = {
    DOM: vdom$,
    HTTP: xs.merge(xs.of({ category: 'login', url: '/v1/login', method: 'POST', send: { username: 'admin', password: 'password' }}), http$),
    router: router$
  }

  return sinks
}

const drivers = {
  DOM: makeDOMDriver('#app-container'),
  HTTP: makeHTTPDriver(),
  router: makeRouterDriver(createHistory(), switchPath),
  cookie: makeCookieDriver()
}

Cycle.run(main, drivers)

import xs from 'xstream'
import { div, h3, p, form, label, input, button } from '@cycle/dom'

const LoginComponent = sources => {
  const getInputValue = className => []
    .slice.call(document.getElementsByClassName(className))
    .reduce((acc, e) => e)
    .value

  // Redirect if authenticated
  const cookie$ = sources.cookie.get('userid')
    .startWith(null)
  const auth$ = cookie$
    .map(authenticated => authenticated ? '/home' : '/login')

  const http$ = sources.DOM.select('.login')
    .events('click')
    .map(event => ({
      category: 'login',
      method: 'POST',
      url: '/v1/login',
      send: {
        username: getInputValue('form-username'),
        password: getInputValue('form-password')
      }
    }))

  const getLogin$ = sources.HTTP.select('login')
    .flatten()
    .map(res => res.body)
    .startWith(null)

  const redirect$ = getLogin$
    .filter(res => res !== null)
    .filter(res => res.err === false)
    .mapTo('/home')

  const vdom$ = getLogin$.map(login => {
    const formDOM = form([
      h3('Please log in to continue'),
      div('.form-group', [
        label('Username'),
        input('.form-control .form-username', { attrs: { type: 'text' } })
      ]),
      div('.form-group', [
        label('Password'),
        input('.form-control .form-password', { attrs: { type: 'text' } })
      ]),
      button('.btn .btn-primary .float-md-right .login', { attrs: { type: 'button' } }, 'Login')
    ])

    return div('.col-md', [
      formDOM
    ])
  })

  const route$ = xs.merge(auth$, redirect$)

  return {
    DOM: vdom$,
    HTTP: http$,
    router: route$
  }
}

export default LoginComponent

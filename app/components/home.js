import xs from 'xstream'
import { div, p, input, button } from '@cycle/dom'

const HomeComponent = sources => {
  const getInputValue = className => []
    .slice.call(document.getElementsByClassName(className))
    .reduce((acc, e) => e)
    .value

  const getFruits$ = sources.HTTP
    .select('fruits')
    .map(response$ => response$.replaceError((err) => xs.of(err.response)))
    .flatten()
    .map(res => res.body)
    .startWith({
      err: false,
      message: 'Loading fruits',
      fruits: []
    })

  const createFruit$ = sources.HTTP
    .select('fruit')
    .map(response$ => response$.replaceError((err) => xs.of(err.response)))
    .flatten()
    .map(res => res.body)
    .startWith(null)

  const fruit$ = sources.DOM
    .select('.create-fruit')
    .events('click')
    .map(() => ({
      category: 'fruit',
      url: '/v1/fruit',
      method: 'POST',
      send: {
        name: getInputValue('form-name')
      }
    }))

  const fruits$ = createFruit$
    .mapTo({
      category: 'fruits',
      url: '/v1/fruit'
    })

  const http$ = xs.merge(fruit$, fruits$)

  const vdom$ = getFruits$.map(fruits => {
    const formDOM = div('.card-deck', [
      div('.card .card-success', [
        input('.form-control .form-name', { attrs: { type: 'text' } }),
        button('.btn .btn-success .create-fruit', 'Submit')
      ])
    ])

    const fruitsDOM = fruits.fruits
      ? div('.card-columns', fruits.fruits.map(fruit => div('.card .card-inverse .card-primary', [
        div('.card-block', [
          p('.card-header', fruit.name)
        ])
      ])))
      : null

    return div([
      formDOM,
      fruitsDOM
    ])
  })

  return {
    DOM: vdom$,
    HTTP: http$
  }
}

export default HomeComponent

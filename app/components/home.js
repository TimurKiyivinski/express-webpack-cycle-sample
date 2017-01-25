import xs from 'xstream'
import { div, p, input, button } from '@cycle/dom'

const HomeComponent = sources => {
  const getInputValue = className => []
    .slice.call(document.getElementsByClassName(className))
    .reduce((acc, e) => e)
    .value

  const getFruits$ = sources.HTTP
    .select('fruits')
    .flatten()
    .replaceError(err => xs.of(err.response))
    .map(res => res.body)
    .startWith({
      err: false,
      message: 'Loading fruits',
      fruits: []
    })

  const createFruit$ = sources.HTTP
    .select('fruit')
    .flatten()
    .replaceError(err => xs.of(err.response))
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

  const fruits$ = xs.merge(xs.of(null), fruit$)
    .mapTo({
      category: 'fruits',
      url: '/v1/fruit'
    })

  const http$ = xs.merge(fruit$, fruits$)

  const vdom$ = xs.combine(getFruits$, createFruit$)
    .map(([fruits, newFruit]) => {
      // Debugging
      console.dir(fruits)
      console.dir(newFruit)

      const formDOM = div('.card-deck', [
        div('.card .card-success', [
          input('.form-control .form-name', { attrs: { type: 'text' } }),
          button('.btn .btn-success .create-fruit', 'Submit')
        ])
      ])

      const fruitsDOM = fruits.err
        ? null
        : div('.card-columns', fruits.fruits.map(fruit => div('.card .card-inverse .card-primary', [
          div('.card-block', [
            p('.card-header', fruit.name)
          ])
        ])))

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

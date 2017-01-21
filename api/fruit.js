function FruitAPI (connection) {
  // MongoDB model
  let Fruit
  try {
    Fruit = connection.model('Fruit')
  } catch (e) {
    Fruit = connection.model('Fruit', {
      name: String
    })
  }

  this.create = req => new Promise((resolve, reject) => {
    const data = {
      name: req.body.name
    }

    Fruit.create(data, (err, fruit) => {
      err
        // Error creating fruit
        ? reject({
          status: 500,
          err: true,
          log: err,
          message: 'Failed to create fruit'
        })
        // No error creating fruit
        : resolve({
          status: 201,
          err: true,
          message: `Fruit ${fruit.name} created`,
          fruit: fruit
        })
    })
  })

  this.read = req => new Promise((resolve, reject) => {
    Fruit.find({}, (err, fruits) => {
      err
        // Error finding fruits
        ? reject({
          status: 500,
          err: true,
          log: err,
          message: 'Failed to find fruits'
        })
        // Check if fruits are found
        : fruits.length === 0
          // No fruits found
          ? reject({
            status: 404,
            err: true,
            log: fruits,
            message: 'No such fruit'
          })
          // Fruits found
          : resolve({
            status: 200,
            err: false,
            fruit: fruits,
            message: 'Found fruits'
          })
    })
  })

  this.readOne = req => new Promise((resolve, reject) => {
    Fruit.findOne({ _id: req.params.id }, (err, fruit) => {
      err
        // Error finding fruit
        ? reject({
          status: 500,
          err: true,
          log: err,
          message: 'Failed to find fruit'
        })
        // Check if fruit is found
        : fruit === null
          // No fruit found
          ? reject({
            status: 404,
            err: true,
            log: fruit,
            message: 'No such fruit'
          })
          // Fruit found
          : resolve({
            status: 200,
            err: false,
            fruit: fruit,
            message: `Fruit ${fruit.name} found`
          })
    })
  })

  this.update = req => new Promise((resolve, reject) => {
    const data = Object.keys(req.body).reduce((obj, key) => {
      obj[key] = req.body[key]
      return obj
    }, {})

    Fruit.findOneAndUpdate({ _id: req.params.id }, data, { new: true }, (err, fruit) => {
      err
        // Error updating fruit
        ? reject({
          status: 500,
          err: true,
          log: err,
          message: 'Failed to update fruit'
        })
        // Check if fruit is found
        : fruit === null
          // No fruit found
          ? reject({
            status: 404,
            err: true,
            log: fruit,
            message: 'No such fruit'
          })
          // Fruit updated
          : resolve({
            status: 200,
            err: false,
            fruit: fruit,
            message: `Fruit ${fruit.name} updated`
          })
    })
  })

  this.delete = req => new Promise((resolve, reject) => {
    Fruit.findOneAndRemove({ _id: req.params.id }, (err, fruit) => {
      err
        // Error finding fruit
        ? reject({
          status: 500,
          err: true,
          log: err,
          message: 'Failed to find fruit'
        })
        // Check if fruit is found
        : fruit === null
          // No fruit found
          ? reject({
            status: 404,
            err: true,
            log: fruit,
            message: 'No such fruit'
          })
          // Fruit deleted
          : resolve({
            status: 200,
            err: false,
            fruit: fruit,
            message: `Fruit ${fruit.name} deleted`
          })
    })
  })
}

module.exports = FruitAPI

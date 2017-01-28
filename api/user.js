function UserAPI (User) {
  this.create = req => new Promise((resolve, reject) => {
    const data = {
      name: req.body.username,
      password: req.body.password // Please don't ever ever ever actually do this
    }

    User.create(data, (err, user) => {
      err
        // Error creating user
        ? reject({
          status: 500,
          err: true,
          log: err,
          message: 'Failed to create user'
        })
        // No error creating user
        : resolve({
          status: 201,
          err: true,
          message: `User ${user.name} created`,
          user: user
        })
    })
  })

  this.read = req => new Promise((resolve, reject) => {
    User.find({}, (err, users) => {
      err
        // Error finding users
        ? reject({
          status: 500,
          err: true,
          log: err,
          message: 'Failed to find users'
        })
        // Check if users are found
        : users.length === 0
          // No users found
          ? reject({
            status: 404,
            err: true,
            log: users,
            message: 'No users found'
          })
          // Users found
          : resolve({
            status: 200,
            err: false,
            users: users,
            message: 'Found users'
          })
    })
  })

  this.readOne = req => new Promise((resolve, reject) => {
    User.findOne({ _id: req.params.id }, (err, user) => {
      err
        // Error finding user
        ? reject({
          status: 500,
          err: true,
          log: err,
          message: 'Failed to find user'
        })
        // Check if user is found
        : user === null
          // No user found
          ? reject({
            status: 404,
            err: true,
            log: user,
            message: 'No such user'
          })
          // User found
          : resolve({
            status: 200,
            err: false,
            user: user,
            message: `User ${user.name} found`
          })
    })
  })

  this.update = req => new Promise((resolve, reject) => {
    const data = Object.keys(req.body).reduce((obj, key) => {
      obj[key] = req.body[key]
      return obj
    }, {})

    User.findOneAndUpdate({ _id: req.params.id }, data, { new: true }, (err, user) => {
      err
        // Error updating user
        ? reject({
          status: 500,
          err: true,
          log: err,
          message: 'Failed to update user'
        })
        // Check if user is found
        : user === null
          // No user found
          ? reject({
            status: 404,
            err: true,
            log: user,
            message: 'No such user'
          })
          // User updated
          : resolve({
            status: 200,
            err: false,
            user: user,
            message: `User ${user.name} updated`
          })
    })
  })

  this.delete = req => new Promise((resolve, reject) => {
    User.findOneAndRemove({ _id: req.params.id }, (err, user) => {
      err
        // Error finding user
        ? reject({
          status: 500,
          err: true,
          log: err,
          message: 'Failed to find user'
        })
        // Check if user is found
        : user === null
          // No user found
          ? reject({
            status: 404,
            err: true,
            log: user,
            message: 'No such user'
          })
          // User deleted
          : resolve({
            status: 200,
            err: false,
            user: user,
            message: `User ${user.name} deleted`
          })
    })
  })
}

module.exports = UserAPI

const startOfToday = moment().startOf('day').toDate();
const startOfTomorrow = moment().add(1, 'days').startOf('day').toDate();

// Query for users created today
User.find({
  createdAt: {
    $gte: startOfToday,
    $lt: startOfTomorrow,
  }
}).then(users => {
  console.log(users);
}).catch(err => {
  console.error(err);
});
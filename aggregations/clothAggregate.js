module.exports = {
  display: 'Покупка скинов в магазине',
  pipeline: [
    {
      $match: {
        action: "buy",
        section: "Skins",
      }
    },
    {
      $group: {
        _id: "$item",
        value: {
          $sum: 1
        }
      }
    }
  ]
}
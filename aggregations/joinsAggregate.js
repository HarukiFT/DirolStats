module.exports = {
    display: 'Заходы на планеты',
    pipeline: [
        {
          $match: {
            action: "join",
          }
        },
        {
          $addFields:
            {
              day: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$timestamp"
                }
              }
            }
        },
        {
          $group: {
            _id: {
              day: "$day",
              planet: "$planet"
            },
            value: {
              $sum: 1
            }
          }
        }
      ]
      
}
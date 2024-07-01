module.exports = {
    display: 'Промокоды',
    pipeline: [
        {
            $match: {
                action: "promo",
                type: {
                    $ne: "skin"
                }
            }
        },
        {
            $group: {
                _id: "$type",
                value: {
                    $sum: 1
                }
            }
        }
    ]
}
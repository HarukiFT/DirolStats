module.exports = {
    display: 'Скины по промокоду',
    pipeline: [
        {
            $match: {
                action: "promo",
                type: "skin",
            }
        },
        {
            $group: {
                _id: "$skin",
                value: {
                    $sum: 1
                }
            }
        }
    ]

}
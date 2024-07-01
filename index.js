const { createObjectCsvWriter } = require('csv-writer')
const { config } = require('dotenv')
const { MongoClient } = require('mongodb')
const readlineSync = require('readline-sync')
const promosAggregate = require('./aggregations/promosAggregate')
const clothAggregate = require('./aggregations/clothAggregate')
const skinsAggregate = require('./aggregations/skinsAggregate')
const joinsAggregate = require('./aggregations/joinsAggregate')

config()

const client = new MongoClient(process.env.CONNECTION_STRING)
const pipelineOrder = [
    promosAggregate,
    clothAggregate,
    skinsAggregate,
    joinsAggregate
]

const getDateInput = (prompt) => {
    return readlineSync.question(prompt)
}

const performAggregation = async (collection, aggregation, firstDate, secondDate) => {
    return collection.aggregate([
        {
            $match: {
                timestamp: {
                    $gte: new Date(firstDate),
                    $lte: new Date(secondDate)
                }
            }
        },
        ...aggregation.pipeline
    ]).toArray()
}

const generateCSV = async (results, aggregationName) => {
    const records = []
    const dates = new Set()

    results = results.sort((a, b) => new Date(a._id.day) - new Date(b._id.day))

    results.forEach(result => dates.add(result._id.day))

    const headers = [
        { id: 'planet', title: 'Планета' },
    ]

    dates.forEach(date => {
        headers.push({ id: date, title: date })
    })

    const csvWriter = createObjectCsvWriter({
        path: `${aggregationName}.csv`,
        header: headers
    })

    const planetsData = {}

    results.forEach(result => {
        if (!planetsData[result._id.planet]) {
            planetsData[result._id.planet] = { [result._id.day]: result.value }
        } else {
            planetsData[result._id.planet][result._id.day] = result.value
        }
    })

    Object.entries(planetsData).forEach(([planet, data]) => {
        records.push({ planet, ...data })
    })

    await csvWriter.writeRecords(records)
    console.log(`Данные записаны в ${aggregationName}.csv`)
}

const mainFunc = async () => {
    try {
        await client.connect()
        console.log("Подключение к базе данных успешно")

        const logs = client.db('logs')
        const dirolLogs = logs.collection('dirol')

        const firstDate = getDateInput("Дата от которой начнем выборку в формате ГГГГ-ММ-ДД: ")
        const secondDate = getDateInput("Дата по которую будет выборка в формате ГГГГ-ММ-ДД: ")

        for (let aggregation of pipelineOrder) {
            console.log(`${aggregation.display}:`)
            const results = await performAggregation(dirolLogs, aggregation, firstDate, secondDate)

            if (results.length > 0 && results[0]._id.day) {
                await generateCSV(results, aggregation.display)
            } else {
                results.forEach(result => {
                    console.log(`${result._id}: ${result.value}`)
                })
            }
            console.log('*----------*')
        }
    } catch (err) {
        console.error("Ошибка:", err)
    } finally {
        await client.close()
        
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on('data', process.exit.bind(process, 0));
    }
}

mainFunc()

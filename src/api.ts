import { Sequelize, Model, DataTypes } from 'sequelize'

// Vytvorime si lokalnu cache a sql db
const cache: CacheItem[] = []
const MAX_CACHE_SIZE = 1000
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './currencies.db',
  logging: false,
})

// Vytvorenie tabuľky
class Currency extends Model {}
Currency.init(
  {
    date: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    data: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Currency',
    tableName: 'currency',
  }
)

// Synchronizácia databázy a vytvorenie tabuľky 'currency'
sequelize.sync().then(() => {
  console.log(`Database & tables created!`)
})

interface CacheItem {
  date: string
  currency: string
  data: any
}

const getDataFromCache = (date: string, currency: string): any => {
  // Overime ci mame pre tento datum a pre tuto menu uz nieco v lokalnej cache
  const cacheItem = cache.find((item) => item.date === date && item.currency === currency)
  if (cacheItem) {
    // Nasli sme prislusny datum aj prislusnu currency a tak mozeme odovzdat parameter z lokalnej cache
    console.log(`We're returning from local cache there is already exists`)
    return cacheItem.data
  }

  // Nasledne overime ci existuje zaznam v sqlite3
  Currency.findOne({
    where: {
      date: date,
      currency: currency,
    },
  })
    .then((record) => {
      if (record) {
        console.log(`We're returning from database because there is already exists in database`)
        return record.dataValues.data
      }
    })
    .catch((error) => {
      console.log(`Cannot find data. Error message: ${error}`)
    })

  return null
}

const setDataToCache = async (date: string, currency: string, data: any): Promise<boolean> => {
  const existingItemIndex = cache.findIndex((item) => item.date === date && item.currency === currency)
  if (existingItemIndex !== -1) {
    // aktualizujeme data ak bol nájený
    cache[existingItemIndex].data = data
  } else {
    // add the new item
    if (cache.length === MAX_CACHE_SIZE) {
      // remove the oldest item if the cache is full
      console.log('Remove oldest from local cache')
      cache.shift()
    }
    console.log('Stored into local cache')
    cache.push({ date, currency, data })
  }
  // Zaroven ho zapiseme do databazy sqlite3 ak este v databaze neexistuje
  Currency.findOne({
    where: {
      date: date,
      currency: currency,
    },
  }).then((record) => {
    if (!record) {
      Currency.create({
        date: date,
        currency: currency,
        data: data,
      })
        .then(() => {
          console.log('Stored into database')
          return true
        })
        .catch((error) => console.error(`Error inserting data: ${data}. Error was ${error}`))
    }
  })
  return false
}

export { Currency, getDataFromCache, setDataToCache }

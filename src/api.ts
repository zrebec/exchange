import { Sequelize, Model, DataTypes } from 'sequelize'

// Vytvorime si lokalnu cache a sql db
const cache: { [date: string]: { [currency: string]: any } } = {}
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './currencies.db',
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

const getDataFromCache = (date: string, currency: string): any => {
  // Overime ci mame pre tento datum a pre tuto menu uz nieco v lokalnej cache
  if (cache[date] && cache[date][currency]) {
    // Nasli sme prislusny datum aj prislusnu currency a tak mozeme odovzdat parameter z lokalnej cache
    console.log(`We're returning from local cache there is already exists`)
    return cache[date][currency]
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
  if (!cache[date]) {
    // Ak nemame prislusny datum, vytvorime si prazdny objekt pre dany datum
    cache[date] = {}
  }
  // Uz vieme, ze nezlyhame do exception pri neexistujucom datume a tak mozeme overit aj dvojrozmerne pole
  if (!cache[date][currency]) {
    // Tento datum a tuto menu este nemame v lokalnej cache a tak hodnotu ulozime
    cache[date][currency] = data
    console.log(`Stored into local cache`)
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
  }
  return false
}

export { Currency, getDataFromCache, setDataToCache }

import express, { Request, Response } from 'express'
import axios from 'axios'
import dotenv from 'dotenv'
import { getDataFromCache, setDataToCache } from './api'
import _ from 'lodash'

// TODO Implementovat sqlite3
// TODO Ak uzivatel zada datumz buducnosti, upozornit ho na to
// TODO Ak uzivatel zada neexistujucu menu, mat nejaku fallback menu, napr. USD a vypisat mu dostupne menny z daneho datumu
//      aby vedel, ze zle zadal menu a ake meny ma k dispozicii
// AK uzivatel zada neplatnu URL, napr. bez meny, dalo by sa ho na to upozornit?
// Ano, da sa na to upozornit, ze sa vytvori nova trasa, proste app.get('/api/rates/:currency/ alebo
// app.get('/api/rates/ ak by nedal žiadny parameter. Otázka je, či ho chceme upozorniť alebo použiť fallbackCurrencz a
// dnešný dátum
// Treba myliseť aj na prípad, ak užívateľ zadá naopak hodnoty. malo by si to poradiť napriek tomu

// Inicializacia app ako express aplikaciu
const app = express()

// Zakladna konfiguracia dotenv, ktory vie nacitavat .env files
dotenv.config()

// zoberieme si API_KEY z .env aby to nemuselo byt na githube
const apiKey: string = process.env.API_KEY

app.get('/api/rates', (req: Request, res: Response) => {
  return res.status(400).json({
    message: `Date and currency is missing. The url should looks like /api/rates/:currency/:date where :date will be your desired date like YYYY-MM-DD and :currency should be USD for example`,
  })
})

app.get('/api/rates/:currency', (req: Request, res: Response) => {
  return res.status(400).json({ message: `Date is missing. Please, enter a valid date to URL in format YYYY-MM-DD` })
})

app.get('/api/rates/:currency/:date', async (req: Request, res: Response) => {
  // Vstupne parametre si dame do samostatnych premennych
  const date: string = req.params.date as string
  const currency: string = req.params.currency as string

  if (_.isNil(date)) {
    return res.status(400).json({ message: `Date is missing. Please, enter a valid date to URL` })
  }

  // Najskor sa pozrieme do lokalnej cache ci mame pre takuto menu a datum uz historicku odpoved
  let localData = await getDataFromCache(date, currency)
  if (!_.isNil(localData)) return res.json(localData)

  // Splitting the date
  const [year, month, day] = date.split('-')

  try {
    const response = await axios.get(`https://v6.exchangerate-api.com/v6/${apiKey}/history/${currency}/${year}/${month}/${day}`)
    // Ak sa vsetko podari a mame response.data, ziskane json ulozime do local cache
    await setDataToCache(date, currency, response.data)
    localData = res.json(response.data)
  } catch (error) {
    if (_.isNil(error.request))
      // Nemame odpoved zo serveru
      return res.status(500).json({ message: `No response received from the server. Returned data: ${error.response.data}` })
    switch (error.response.status) {
      case 403:
        return res.status(403).json({ message: 'Error 403: Forbidden access' })
      case 404:
        return res.status(404).json({ message: 'Error 404: Not Found' })
      case 500:
        return res.status(500).json({ message: `Error 505: Internal Server Error. Reason: ${error.response.data}` })
      default:
        return res.status(500).json({ message: `An unexpected error occurred. Reason ${error.response.data}` })
    }
  }
})

const port = 3000
app.listen(port, () => console.log(`Server is running on port ${port}`))

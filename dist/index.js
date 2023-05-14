"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const sequelize_1 = require("sequelize");
const _ = require('lodash');
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
const app = (0, express_1.default)();
// Zakladna konfiguracia dotenv, ktory vie nacitavat .env files
dotenv_1.default.config();
// zoberieme si API_KEY z .env aby to nemuselo byt na githube
const apiKey = process.env.API_KEY;
// Vytvorime si lokalnu cache a sql db
const cache = {};
const sequelize = new sequelize_1.Sequelize({
    dialect: 'sqlite',
    storage: './currencies.db',
});
// Vytvorenie tabuľky
class Currency extends sequelize_1.Model {
}
Currency.init({
    date: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    currency: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    data: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: false,
    },
}, {
    sequelize,
    modelName: 'Currency',
    tableName: 'currency',
});
// Synchronizácia databázy a vytvorenie tabuľky 'currency'
sequelize.sync().then(() => {
    console.log(`Database & tables created!`);
});
const getDataFromCache = (date, currency) => {
    // Overime ci mame pre tento datum a pre tuto menu uz nieco v lokalnej cache
    if (cache[date] && cache[date][currency]) {
        // Nasli sme prislusny datum aj prislusnu currency a tak mozeme odovzdat parameter z lokalnej cache
        console.log(`We're returning from local cache there is already exists`);
        return cache[date][currency];
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
            console.log(`We're returning from database because there is already exists in database`);
            return record.dataValues.data;
        }
    })
        .catch((error) => {
        console.log(`Cannot find data. Error message: ${error}`);
    });
    return null;
};
const setDataToCache = (date, currency, data) => __awaiter(void 0, void 0, void 0, function* () {
    if (!cache[date]) {
        // Ak nemame prislusny datum, vytvorime si prazdny objekt pre dany datum
        cache[date] = {};
    }
    // Uz vieme, ze nezlyhame do exception pri neexistujucom datume a tak mozeme overit aj dvojrozmerne pole
    if (!cache[date][currency]) {
        // Tento datum a tuto menu este nemame v lokalnej cache a tak hodnotu ulozime
        cache[date][currency] = data;
        console.log(`Stored into local cache`);
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
                    console.log('Stored into database');
                    return true;
                })
                    .catch((error) => console.error(`Error inserting data: ${data}. Error was ${error}`));
            }
        });
    }
    return false;
});
app.get('/api/rates/:currency/:date', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Vstupne parametre si dame do samostatnych premennych
    const date = req.params.date;
    const currency = req.params.currency;
    if (_.isNil(date)) {
        return res.status(400).json({ message: `Date is missing. Please, enter a valid date to URL` });
    }
    // Najskor sa pozrieme do lokalnej cache ci mame pre takuto menu a datum uz historicku odpoved
    const localData = getDataFromCache(date, currency);
    // Ak mame historicku hodnotu pre konkretny datum a menu, teda localData nie je false
    // vratime to z navratovej hodnotz funkcie getDataFromLocalCache pretoze uz nebude null
    // return pouzivam preto, aby som co najskor vratil odpoved a nepokracoval dalej
    // Dalo by sa to aj tak, ze budeme vnarat do seba if a else bloky ale tento sposob mne
    // pride citatelnejsi. Proste vyradit vsetky negativne podmienky ako overovat pozitivnu
    // podmienku a do else potom davat nejake vynimky, pretoze velmi rychlo sa vieme stratit
    // vo vnorenych podmienkach
    if (!_.isNil(localData))
        return res.json(localData);
    // Splitting the date
    const [year, month, day] = date.split('-');
    try {
        const response = yield axios_1.default.get(`https://v6.exchangerate-api.com/v6/${apiKey}/history/${currency}/${year}/${month}/${day}`);
        // Ak sa vsetko podari a mame response.data, ziskane json ulozime do local cache
        setDataToCache(date, currency, response.data);
        res.json(response.data);
    }
    catch (error) {
        if (_.isNil(error.request))
            // Nemame odpoved zo serveru
            return res.status(500).json({ message: `No response received from the server. Returned data: ${error.response.data}` });
        switch (error.response.status) {
            case 403:
                return res.status(403).json({ message: 'Error 403: Forbidden access' });
            case 404:
                return res.status(404).json({ message: 'Error 404: Not Found' });
            case 500:
                return res.status(500).json({ message: `Error 505: Internal Server Error. Reason: ${error.response.data}` });
            default:
                return res.status(500).json({ message: `An unexpected error occurred. Reason ${error.response.data}` });
        }
    }
}));
const port = 3000;
app.listen(port, () => console.log(`Server is running on port ${port}`));
//# sourceMappingURL=index.js.map
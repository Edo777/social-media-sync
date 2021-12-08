"use strict";
const geographic = require("./static/geographic.json");

module.exports = {
    up: (queryInterface, Sequelize) => {
        const KEY_JOIN_KEYVALUE = ":";
        const KEY_JOIN_PARENT = "||";

        return new Promise(async (resolve, reject) => {
            try {
                let regionsCreateData = [];
                let citiesCreateData = [];

                /** GENERATE COUNTRIES */
                const countriesCreateData = Object.keys(geographic)
                    // .filter((cc) => {
                    //     return ["RU", "AM"].includes(cc);
                    // })
                    .map((cc) => {
                        /** GENERATE REGIONS */
                        const currentCountryRegions = geographic[cc].regions;
                        const _regions = Object.keys(currentCountryRegions).map((rc) => {
                            /** GENERATE CITIES */
                            const currentRegionCities = currentCountryRegions[rc]["cities"];
                            const _cities = currentRegionCities.map((city) => {
                                return {
                                    code: city.name.en,
                                    // eslint-disable-next-line camelcase
                                    translate_key: [
                                        `hy${KEY_JOIN_KEYVALUE}${city.name.hy}`,
                                        `ru${KEY_JOIN_KEYVALUE}${city.name.ru}`,
                                        `en${KEY_JOIN_KEYVALUE}${city.name.en}`,
                                    ].join(KEY_JOIN_PARENT),
                                    timezone: city.timezone,
                                    offset: city.offset,
                                    countryCode: cc,
                                    regionCode: rc,
                                };
                            });
                            /** END GENERATE CITIES */
                            citiesCreateData.push(..._cities);

                            return {
                                code: rc,
                                // eslint-disable-next-line camelcase
                                translate_key: [
                                    `hy${KEY_JOIN_KEYVALUE}${currentCountryRegions[rc].name.hy}`,
                                    `ru${KEY_JOIN_KEYVALUE}${currentCountryRegions[rc].name.ru}`,
                                    `en${KEY_JOIN_KEYVALUE}${currentCountryRegions[rc].name.en}`,
                                ].join(KEY_JOIN_PARENT),
                                countryCode: cc,
                            };
                        });
                        /** END GENERATE REGIONS */
                        regionsCreateData.push(..._regions);

                        return {
                            code: cc,
                            // eslint-disable-next-line camelcase
                            translate_key: [
                                `hy${KEY_JOIN_KEYVALUE}${geographic[cc].name.hy}`,
                                `ru${KEY_JOIN_KEYVALUE}${geographic[cc].name.ru}`,
                                `en${KEY_JOIN_KEYVALUE}${geographic[cc].name.en}`,
                            ].join(KEY_JOIN_PARENT),
                        };
                    });
                /** END GENERATE COUNTRIES */

                /** CREATE COUNTRIES */
                await queryInterface.bulkInsert("app_countries", countriesCreateData);

                /** SELECT CREATED COUNTRIES */
                const createdCountries = await queryInterface.sequelize.query(
                    `SELECT id, code from app_countries`,
                    { type: queryInterface.sequelize.QueryTypes.SELECT }
                );

                /** PREPARE REGIONS TO CREATE */
                for (let c = 0; c < createdCountries.length; c++) {
                    for (let j = 0; j < regionsCreateData.length; j++) {
                        if (createdCountries[c].code === regionsCreateData[j].countryCode) {
                            regionsCreateData[j].countryId = createdCountries[c].id;
                        }
                    }
                }

                regionsCreateData = regionsCreateData.map((rcd) => ({
                    code: rcd.code,
                    // eslint-disable-next-line camelcase
                    translate_key: rcd.translate_key,
                    // eslint-disable-next-line camelcase
                    country_id: rcd.countryId,
                }));

                /** CREATE REGIONS */
                await queryInterface.bulkInsert("app_regions", regionsCreateData);

                /** SELECT CREATED REGIONS */
                const createdRegions = await queryInterface.sequelize.query(
                    `
                        SELECT
                            app_regions.id as id, 
                            app_regions.code as code, 
                            app_regions.country_id as countryId, 
                            app_countries.code as countryCode 
                        FROM app_regions
                        INNER JOIN app_countries ON app_countries.id = app_regions.country_id
                    `,
                    { type: queryInterface.sequelize.QueryTypes.SELECT }
                );

                /** PREPARE CITIES TO CREATE */
                for (let c = 0; c < createdRegions.length; c++) {
                    for (let j = 0; j < citiesCreateData.length; j++) {
                        const regionCodeCond =
                            createdRegions[c].code == citiesCreateData[j].regionCode;
                        const countryCodeCond =
                            createdRegions[c].countryCode == citiesCreateData[j].countryCode;

                        if (regionCodeCond && countryCodeCond) {
                            citiesCreateData[j].countryId = createdRegions[c].countryId;
                            citiesCreateData[j].regionId = createdRegions[c].id;
                        }
                    }
                }

                citiesCreateData = citiesCreateData.map((ccd) => ({
                    code: ccd.code,
                    // eslint-disable-next-line camelcase
                    translate_key: ccd.translate_key,
                    offset: ccd.offset,
                    timezone: ccd.timezone,
                    // eslint-disable-next-line camelcase
                    country_id: ccd.countryId,
                    // eslint-disable-next-line camelcase
                    region_id: ccd.regionId,
                }));

                /** CREATE CITIES */
                await queryInterface.bulkInsert("app_cities", citiesCreateData);

                resolve();
            } catch (e) {
                console.error(e);
                reject(e);
            }
        });
    },

    down: (queryInterface, Sequelize) => {
        /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('People', null, {});
    */
    },
};

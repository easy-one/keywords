import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/catch';

import {Report} from '../models/report';

import any = jasmine.any;
import {InputDataRow, SeoData} from "../models/input-data-row";
import {by} from "protractor";

@Injectable()
export class ReportService {
    public reportList: Report[] = [];
    private urlPrefix = location.protocol + '//' + location.hostname + '/';
    private reportUrl = this.urlPrefix + 'api/reports.php';
    private userUrl = this.urlPrefix + 'api/users.php';
    private seoDataUrl = this.urlPrefix + 'api/seoData.php';
    private logoutUrl = this.urlPrefix + 'api/login.php';
    private headers = new Headers({ Authorization: window['xsrfToken'] });
    private queryAmount = 0;

    constructor(private http: Http) { }


    parseCsv(csvText): any {
        let strDelimiter = ',';
        let objPattern = new RegExp(
            (
                // Delimiters.
                "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

                // Quoted fields.
                "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

                // Standard fields.
                "([^\"\\" + strDelimiter + "\\r\\n]*))"
            ),
            "gi"
        );
        // todo all values except the first one are non quoted !

        let newRow = [];
        let parsedCsv = [newRow];

        // Create an array to hold our individual pattern
        // matching groups.
        let arrMatches;

        let g = new RegExp( "\"\"", "g" );

        // Keep looping over the regular expression matches
        // until we can no longer find a match.
        while (arrMatches = objPattern.exec( csvText )){

            // Get the delimiter that was found.
            let strMatchedDelimiter = arrMatches[ 1 ];

            // Check to see if the given delimiter has a length
            // (is not the start of string) and if it matches
            // field delimiter. If id does not, then we know
            // that this delimiter is a row delimiter.
            if (
                strMatchedDelimiter.length &&
                strMatchedDelimiter !== strDelimiter
            ){
                // Since we have reached a new row of data,
                // add an empty row to our data array.
                newRow = [];
                parsedCsv.push(newRow);
            }

            let strMatchedValue;

            // Now that we have our delimiter out of the way,
            // let's check to see which kind of value we
            // captured (quoted or unquoted).
            if (arrMatches[ 2 ]){
                // We found a quoted value. When we capture
                // this value, unescape any double quotes.
                strMatchedValue = arrMatches[ 2 ].replace(g, "\"");
            }
            else {
                // We found a non-quoted value.
                strMatchedValue = arrMatches[ 3 ];
            }


            // Now that we have our value string, let's add
            // it to the data array.
            newRow.push( strMatchedValue );
        }

        let inputDataRows = [];

        for (let i = 1, n = parsedCsv.length; i < n; i++) {
            let csvRow = parsedCsv[i],
                query = csvRow[0],
                clicks = +csvRow[1],
                impressions = +csvRow[2],
                ctr = parseFloat(csvRow[3]) * 1000,
                position = +csvRow[4] * 10;

            if (query) {
                inputDataRows.push({
                    query: query,
                    clicks: clicks,
                    impressions: impressions,
                    ctr: ctr / 100000,
                    position: position / 10,
                    page: ''
                });

                parsedCsv[i - 1] = [query, clicks, impressions, ctr, position];
            }
            else {
                parsedCsv.pop();
            }
        }
        parsedCsv.pop();

        return [inputDataRows, parsedCsv];
    }


    getReports(): Promise<Report[]> {
        return this.http
            .get(this.reportUrl, { headers: this.headers })
            .toPromise()
            .then(response => {
                this.reportList = response.json();
                return this.reportList;
            })
            .catch(this.handleError);
    }


    getReport(id: number): Promise<any> {
        return this.http
            .get(this.reportUrl + '?id=' + id, { headers: this.headers })
            .toPromise()
            .then(response => {
                let all = response.json();
                return {
                    name: all.name,
                    keywords: all.keywords,
                    isGoogle: (all.is_google == '1'),
                    siteUrl: all.siteUrl,
                    yes_date: all.yes_date,
                    isOwner: all.isOwner,
                    dateFromAvailable: all.dateFromAvailable,
                    dateToAvailable: all.dateToAvailable
                };
            })
            .catch(this.handleError);
    }


    googleDataToInputDataRow(googleData) {
        let byKey = {},
            readyForSave = [];

        for (let i = 0, n = googleData.length; i < n; i++) {
            let row = googleData[i],
                query = row.keys[0],
                page = row.keys[1],
                dateArr = row.keys[2].split('-'),
                key = query + page,
                date = Date.UTC(dateArr[0], dateArr[1] - 1, dateArr[2]) / 1000,
                clicks = Math.round(row.clicks),
                impressions = Math.round(row.impressions),
                ctr = Math.round(row.ctr * 100000),
                position = Math.round(row.position * 10);

            let avail = byKey[key];
            if (avail) {
                avail.clicks += clicks;
                avail.impressions += impressions;
                avail.ctr += ctr / 100000;
                avail.position += position / 10;
                avail.count++;  //todo
            }
            else {
                byKey[key] = {
                    query: query,
                    page: page,
                    clicks: clicks,
                    impressions: impressions,
                    ctr: ctr / 100000,
                    position: position / 10,
                    count: 1
                };
            }

            readyForSave.push([query, clicks, impressions, ctr, position, date, page]);
        }

        let response = [];
        for (let key in byKey) {
            let el = byKey[key];
            el.ctr = el.ctr / el.count;
            el.position = el.position / el.count;
            response.push(el);
        }

        return [response, readyForSave];
    }


    // convertDataToCsv(data): string {
    //     let str = 'Queries,Clicks,Impressions,CTR,Position\n';
    //
    //     for (let i = 0; i < data.length; i++) {
    //         let row = data[i],
    //             q = row.queries;
    //
    //         if (q.search(/("|,|\n)/g) >= 0) {
    //             q = '"' + q + '"';
    //         }
    //         str += q + ','
    //             + row.clicks + ','
    //             + row.impressions + ','
    //             + row.ctr + '%,'
    //             + row.position + '\n';
    //     }
    //
    //     return str.substr(0, str.length-1);
    // }


    setUserCode(code) {
        return this.http
            .put(this.userUrl, {code: code}, { headers: this.headers })
            .toPromise()
            .catch(this.handleError);
    }


    private requestToGoogle(startDate: Date, endDate: Date, siteUrl: string): Promise<any> {

        function leadingZero(number:Number) {
            return (number < 10) ? '0' + number : number;
        }

        function googleFormattedDate(date: Date) {
            return date.getUTCFullYear() + '-' + leadingZero(date.getUTCMonth() + 1) + '-' + leadingZero(date.getUTCDate());
        }


        let gapi = window['gapi'];
        let apiKey = window['apiKey'];

        return gapi.client.request({
            path: 'https://www.googleapis.com/webmasters/v3/sites/'+ encodeURIComponent(siteUrl) + '/searchAnalytics/query',
            method: 'POST',
            params: {
                key: apiKey
            },
            body: {
                "startDate": googleFormattedDate(startDate),
                "endDate": googleFormattedDate(endDate),
                "rowLimit": 5000,
                "dimensions": [
                    "query", "page", "date"
                ]
            }
        })
            .then(
                response => this.googleDataToInputDataRow(response.result.rows),
                reason => alert('Error: ' + reason.result.error.message)
            );
    }



    getDataFromGoogleApi(siteUrl:string): Promise<any> {
        return new Promise((resolve, reject) => {
            let now = new Date();

            function daysAgo(days): Date {
                return new Date(now.getFullYear(), now.getMonth(), now.getDate() - days);
                // return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - days);
            }


            let getChunkFormGoogle = (startDaysAgo) => {
                let endDaysAgo = startDaysAgo - 6;
                if (endDaysAgo < 2) {
                    endDaysAgo = 2;
                }

                this.requestToGoogle(daysAgo(startDaysAgo), daysAgo(endDaysAgo), siteUrl).then(result => {
                    response = response.concat(result[0]);      // todo push
                    readyToSave = readyToSave.concat(result[1]);

                    if (endDaysAgo !== 2) {
                        setTimeout(() => getChunkFormGoogle(endDaysAgo - 1), 200);
                    }
                    else {
                        resolve([response, readyToSave]);
                    }
                });
            };


            let response = [],
                readyToSave = [],
                requestStartTime = Date.now();

            getChunkFormGoogle(96);
        });
    }


    create(name: string, keywords: string, isGoogle: boolean, siteUrl: string, seoData: SeoData): Promise<any> {
        return this.http
            .post(this.reportUrl, {name, keywords, isGoogle, siteUrl, seoData}, { headers: this.headers })
            .toPromise()
            .then(response => response.text())
            .catch(this.handleError);
    }


    update(id: number, name: string, siteUrl: string, keywords: string, seoData: SeoData | undefined): Promise<any> {
        return this.http
            .put(this.reportUrl + '?id=' + id, {name, siteUrl, keywords, seoData}, { headers: this.headers })
            .toPromise()
            .catch(this.handleError);
    }


    changeYesTime(id: number): Promise<any> {
        return this.http
            .patch(this.reportUrl + '?id=' + id, { headers: this.headers })
            .toPromise()
            .catch(this.handleError);
    }


    getSeoData(id: number, startTime: Number, endTime: Number): Promise<any> {
        let url = '';
        if (startTime) {
            url = '&start=' + startTime + '&end=' + endTime;
        }
        return this.http
            .get(this.seoDataUrl + '?id=' + id + url, { headers: this.headers })
            .toPromise()
            .then((response) => {
                let data = response.json(),
                    inputData = []; // todo better parse than json?

                for (let i = 0, n = data.length; i < n; i++) {
                    let row = data[i];
                    inputData.push({
                        query: row[0],
                        page: row[1],
                        clicks: +row[2],
                        impressions: +row[3],
                        ctr: row[4] / 100000,
                        position: row[5] / 10
                    });
                }
                return inputData;
            })
            .catch(this.handleError);
    }


    delete(id: number): Promise<any> {
        return this.http
            .delete(this.reportUrl + '?id=' + id, { headers: this.headers })
            .toPromise()
            .catch(this.handleError);
    }


    logout(): Promise<any> {
        return this.http.post(this.logoutUrl, { logout: window['xsrfToken'] })
            .toPromise()
            .then(function () {
                window.location.href = 'https://www.google.com/accounts/Logout?continue=https://appengine.google.com/_ah/logout?continue=' + window.location.href;
            });
    }


    private handleError(error: any): Promise<any> {
        console.error('An error occurred', error); // TODO aler message
        window['hideLoader']();
        return Promise.reject(error.message || error);
    }
}
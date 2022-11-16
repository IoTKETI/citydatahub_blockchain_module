/**
 * Copyright 2017 Kapil Sachdeva All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

export function getErrorMessage(field: string) {
    const response = {
        success: false,
        message: field + ' field is missing or Invalid in the request'
    };
    return response;
}

export function GetCurrentTimestamp(): string {
    const today = new Date();
    const year = today.getFullYear(); 
    const month = today.getMonth() + 1; 
    const date = today.getDate();
    const hour = today.getHours();
    const minute = today.getMinutes();
    const seconds = today.getSeconds(); 
    const milli = today.getMilliseconds(); 

    const dateString = year.toString().substr(2, 2) + month.toString().padStart(2, '0') + date.toString().padStart(2, '0') + hour.toString().padStart(2, '0') + minute.toString().padStart(2, '0') + seconds.toString().padStart(2, '0') + milli.toString().padStart(2, '0');
    return dateString;
};

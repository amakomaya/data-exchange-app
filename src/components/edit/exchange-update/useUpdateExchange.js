import { useDataEngine } from '@dhis2/app-runtime'
import { useCallback, useState } from 'react'
import { getExchangeValuesFromForm } from './getExchangeValues.js'

const getChange = ({ field, value }) => ({
    op: 'add',
    path: '/' + field,
    value: value ?? null,
})

const getJsonPatch = ({ formattedValues, form, requestsTouched }) => {
    const changes = []
    const modifiedFields = new Set(Object.keys(form.getState().dirtyFields))

    if (modifiedFields.has('name')) {
        changes.push(getChange({ field: 'name', value: formattedValues.name }))
    }

    // check if one field has been modified for target
    const targetIdSchemes = [
        'idScheme',
        'dataElementIdScheme',
        'orgUnitIdScheme',
        'categoryOptionComboIdScheme',
    ]
    const targetIdSchemesFields = targetIdSchemes.reduce((allNames, scheme) => {
        return [...allNames, `target_${scheme}`, `target_${scheme}_attribute`]
    }, [])
    const targetFields = [
        'type',
        'authentication',
        'url',
        'username',
        ...targetIdSchemesFields,
    ]
    if (targetFields.some((tf) => modifiedFields.has(tf))) {
        changes.push(
            getChange({ field: 'target', value: formattedValues.target })
        )
    }

    if (requestsTouched) {
        changes.push(
            getChange({ field: 'source', value: formattedValues.source })
        )
    }

    return changes
}


export const useUpdateExchange = ({ onComplete }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const refetch = useCallback(
        async ({
            id,
            form,
            values,
            requests,
            requestsTouched,
            newExchange,
        }) => {
            // Set to loading
            setLoading(true);
            let response = null;
            try {
                const formattedValues = getExchangeValuesFromForm({
                    values,
                    requests,
                });

                const request = formattedValues?.source?.requests[0];
                const dx = request?.dx.join(';'); 
                const ou = request?.ou.join(';'); 
                const periodData = request?.peInfo;
                const startDate = periodData[0].startDate;
                const endDate = periodData[0].endDate;
                const baseUrl = 'http://localhost:9999';                 
                const endpoint = '/api/analytics.json';
            
                const url = `${baseUrl}${endpoint}?dimension=dx:${dx}&dimension=ou:${ou}&startDate=${startDate}&endDate=${endDate}`;
                

    
                const fetchResponse = await fetch(url);
                if (!fetchResponse.ok) {
                    throw new Error(`HTTP error! status: ${fetchResponse.status}`);
                }
                response = await fetchResponse.json();
                
            } catch (e) {
                console.error(e);
                setError(e);
            } finally {
                setLoading(false);
            }

            return response;
        },
        [onComplete]
    );

    return [refetch, { loading, error }];
};






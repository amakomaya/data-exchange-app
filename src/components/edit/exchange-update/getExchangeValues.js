import {
    SCHEME_TYPES,
    EXCHANGE_TYPES,
    AUTHENTICATION_TYPES,
} from '../shared/index.js'

const removeRequestIDSchemeValuesOfNONE = ({ requests }) => {
    const idSchemeProps = [
        'idScheme',
        'dataElementIdScheme',
        'orgUnitIdScheme',
        'categoryOptionComboIdScheme',
    ]
    return requests.map((request) => {
        const requestCopy = { ...request }
        for (const prop of idSchemeProps) {
            if (requestCopy[prop] === SCHEME_TYPES.none) {
                delete requestCopy[prop]
            }
        }
        return requestCopy
    })
}

const getFormIdSchemeValues = ({ values }) => {
    const idSchemeProps = [
        'idScheme',
        'dataElementIdScheme',
        'orgUnitIdScheme',
        'categoryOptionComboIdScheme',
    ]
    return idSchemeProps.reduce((idSchemeValues, prop) => {
        const attributeProp = `target_${prop}_attribute`
        if (values[`target_${prop}`] !== SCHEME_TYPES.none) {
            idSchemeValues[prop] =
                values[`target_${prop}`] !== SCHEME_TYPES.attribute
                    ? values[`target_${prop}`]
                    : `ATTRIBUTE:${values[attributeProp]}`
        }
        return idSchemeValues
    }, {})
}

const getTargetDetails = ({ values }) => {
    const target = {
        type: values.type,
        request: {
            ...getFormIdSchemeValues({ values }),
        },
    }
    if (values.type === EXCHANGE_TYPES.internal) {
        return target
    }
    // upate to include api
    target.api = {
        url: values.url,
    }

    if (values.authentication === AUTHENTICATION_TYPES.pat) {
        return {
            ...target,
            api: {
                ...target.api,
                accessToken: values.accessToken,
            },
        }
    }
    return {
        ...target,
        api: {
            ...target.api,
            username: values.username,
            password: values.password,
        },
    }
}

export const getExchangeValuesFromForm = ({ values, requests }) => ({
    name: values.name,
    target: getTargetDetails({ values }),
    source: { requests: removeRequestIDSchemeValuesOfNONE({ requests }) },
})

const getIdSchemeValues = ({ exchangeInfo }) => {
    const defaultSchemeProp = 'idScheme'
    const idSchemeProps = [
        defaultSchemeProp,
        'orgUnitIdScheme',
        'dataElementIdScheme',
        'categoryOptionComboIdScheme',
    ]
    return idSchemeProps.reduce((idSchemeValues, prop) => {
        idSchemeValues[`target_${prop}`] = exchangeInfo.target?.request?.[prop]
            ? exchangeInfo.target.request?.[prop]?.split(':')[0]?.toUpperCase()
            : prop === defaultSchemeProp
            ? SCHEME_TYPES.uid
            : SCHEME_TYPES.none
        idSchemeValues[`target_${prop}_attribute`] =
            exchangeInfo.target?.request?.[prop]?.split(':')[1]
        return idSchemeValues
    }, {})
}

export const getInitialValuesFromExchange = ({ exchangeInfo }) => ({
    name: exchangeInfo.name,
    type: exchangeInfo.target?.type,
    authentication: exchangeInfo.target?.api?.username
        ? AUTHENTICATION_TYPES.basic
        : AUTHENTICATION_TYPES.pat,
    url: exchangeInfo.target?.api?.url,
    username: exchangeInfo.target?.api?.username,
    ...getIdSchemeValues({ exchangeInfo }),
})

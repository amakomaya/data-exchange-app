import { SCHEME_TYPES } from '../shared/index.js'

const getFormIdSchemeValues = ({
    requestValues,
    outputDataItemIdSchemeAvailable,
}) => {
    const baseIdSchemeProps = [
        'outputIdScheme',
        'outputDataElementIdScheme',
        'outputOrgUnitIdScheme',
    ]
    const idSchemeProps = outputDataItemIdSchemeAvailable
        ? [...baseIdSchemeProps, 'outputDataItemIdScheme']
        : baseIdSchemeProps
    return idSchemeProps.reduce((idSchemeValues, prop) => {
        const attributeProp = `source_${prop}_attribute`

        idSchemeValues[prop] =
            requestValues[`source_${prop}`] !== SCHEME_TYPES.attribute
                ? requestValues[`source_${prop}`]
                : `ATTRIBUTE:${requestValues[attributeProp]}`

        return idSchemeValues
    }, {})
}

// export const getRequestValuesFromForm = ({
//     requestValues,
//     outputDataItemIdSchemeAvailable,
// }) => {
//     // console.log(requestValues,'requestValues')
//     const validFilters = !requestValues.filtersUsed
//         ? []
//         : requestValues?.filtersInfo
//               .filter((f) => f.items?.length > 0)
//               .map((filter) => ({
//                   ...filter,
//                   items: filter.items.map(({ id }) => id),
//               }))

//     const filtersActuallyUsed =
//         requestValues.filtersUsed && validFilters.length > 0
//         requestValues.peInfo = [
            
//             // {"id": "20810101", "name": "2081-01-01"},
//             // {"id": "20810102", "name": "2081-01-02"},
//             // {"id": "20810103", "name": "2081-01-03"},
//             // {"id": "20810104", "name": "2081-01-04"},
//             // {"id": "20810105", "name": "2081-01-05"},
//             // {"id": "20810106", "name": "2081-01-06"},
//             // {"id": "20810107", "name": "2081-01-07"},
//             // {"id": "20810108", "name": "2081-01-08"},
//             // {"id": "20810109", "name": "2081-01-09"},
//             // {"id": "20810110", "name": "2081-01-10"},
//             // {"id": "20810111", "name": "2081-01-11"},
//             // {"id": "20810112", "name": "2081-01-12"},
//             // {"id": "20810113", "name": "2081-01-13"},
//             // {"id": "20810114", "name": "2081-01-14"},
//             // {"id": "20810115", "name": "2081-01-15"},
//             // {"id": "20810116", "name": "2081-01-16"},
//             // {"id": "20810117", "name": "2081-01-17"},
//             // {"id": "20810118", "name": "2081-01-18"},
//             // {"id": "20810119", "name": "2081-01-19"},
//             // {"id": "20810120", "name": "2081-01-20"},
//             // {"id": "20810121", "name": "2081-01-21"},
//             // {"id": "20810122", "name": "2081-01-22"},
//             // {"id": "20810123", "name": "2081-01-23"},
//             // {"id": "20810124", "name": "2081-01-24"},
//             // {"id": "20810125", "name": "2081-01-25"},
//             // {"id": "20810126", "name": "2081-01-26"},
//             // {"id": "20810127", "name": "2081-01-27"},
//             // {"id": "20810128", "name": "2081-01-28"},
//             // {"id": "20810129", "name": "2081-01-29"},
//             // {"id": "20810130", "name": "2081-01-30"}
//             // {"id": "208105", "name": "Bhadra 2081"}

            
            
//         ]; 

//         console.log(requestValues);
//     return {
//         ...requestValues,
//         name: requestValues.requestName,
//         dx: requestValues?.dxInfo.map(({ id }) => id),
//         pe: requestValues?.peInfo.map(({ id }) => id),

//         // pe: '208101',
//         ou: requestValues?.ouInfo.map(({ id }) => id),
//         visualization: requestValues.visualizationLinked
//             ? requestValues?.visualizationInfo?.id
//             : null,
//         filters: !filtersActuallyUsed ? [] : validFilters,
//         filtersInfo: !filtersActuallyUsed ? null : requestValues.filtersInfo,
//         visualizationInfo: !requestValues.visualizationLinked
//             ? null
//             : requestValues.visualizationInfo,
//         inputIdScheme: SCHEME_TYPES.uid,
//         ...getFormIdSchemeValues({
//             requestValues,
//             outputDataItemIdSchemeAvailable,
//         }),
//     }
// }

export const getRequestValuesFromForm = ({
    requestValues,
    outputDataItemIdSchemeAvailable,
}) => {
    const pe = requestValues.pe;
    const peInfo = requestValues.peInfo;
    console.log(peInfo,'peInfo')

    return {
        ...requestValues,
        name: requestValues.requestName,
        dx: requestValues?.dxInfo.map(({ id }) => id),
        // pe, 
        peInfo,
        ou: requestValues?.ouInfo.map(({ id }) => id),
        visualization: requestValues.visualizationLinked
            ? requestValues?.visualizationInfo?.id
            : null,
        filters: !requestValues.filtersUsed ? [] : validFilters,
        filtersInfo: !requestValues.filtersUsed ? null : requestValues.filtersInfo,
        visualizationInfo: !requestValues.visualizationLinked
            ? null
            : requestValues.visualizationInfo,
        inputIdScheme: SCHEME_TYPES.uid,
        ...getFormIdSchemeValues({
            requestValues,
            outputDataItemIdSchemeAvailable,
        }),
    };
};


const getIdSchemeValues = ({ request, outputDataItemIdSchemeAvailable }) => {
    const defaultSchemeProp = 'outputIdScheme'
    const baseIdSchemeProps = [
        defaultSchemeProp,
        'outputDataElementIdScheme',
        'outputOrgUnitIdScheme',
    ]
    const idSchemeProps = outputDataItemIdSchemeAvailable
        ? [...baseIdSchemeProps, 'outputDataItemIdScheme']
        : baseIdSchemeProps
    return idSchemeProps.reduce((idSchemeValues, prop) => {
        idSchemeValues[`source_${prop}`] = request?.[prop]
            ? request?.[prop]?.split(':')[0]?.toUpperCase()
            : prop === defaultSchemeProp
            ? SCHEME_TYPES.uid
            : SCHEME_TYPES.none
        idSchemeValues[`source_${prop}_attribute`] =
            request?.[prop]?.split(':')[1]
        return idSchemeValues
    }, {})
}

export const getInitialValuesFromRequest = ({
    request,
    outputDataItemIdSchemeAvailable,
}) => ({
    requestName: request?.name,
    peInfo: request?.peInfo ?? [],
    ouInfo: request?.ouInfo ?? [],
    dxInfo: request?.dxInfo ?? [],
    filtersUsed: request?.filtersInfo?.length > 0,
    filtersInfo: request?.filtersInfo ?? [{ dimension: null }],
    visualizationLinked: Boolean(request.visualization),
    visualizationInfo: request?.visualizationInfo ?? null,
    ...getIdSchemeValues({ request, outputDataItemIdSchemeAvailable }),
})

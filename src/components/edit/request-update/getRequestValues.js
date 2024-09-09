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

export const getRequestValuesFromForm = ({
    requestValues,
    outputDataItemIdSchemeAvailable,
}) => {
    const validFilters = !requestValues.filtersUsed
        ? []
        : requestValues?.filtersInfo
              .filter((f) => f.items?.length > 0)
              .map((filter) => ({
                  ...filter,
                  items: filter.items.map(({ id }) => id),
              }))

    const filtersActuallyUsed =
        requestValues.filtersUsed && validFilters.length > 0
        requestValues.peInfo = [
            { id: "20240801", name: "2024-08-01" },
            { id: "20240802", name: "2024-08-02" },
            { id: "20240803", name: "2024-08-03" },
            { id: "20240804", name: "2024-08-04" },
            { id: "20240805", name: "2024-08-05" },
            { id: "20240806", name: "2024-08-06" },
            { id: "20240807", name: "2024-08-07" },
            { id: "20240808", name: "2024-08-08" },
            { id: "20240809", name: "2024-08-09" },
            { id: "20240810", name: "2024-08-10" },
            { id: "20240811", name: "2024-08-11" },
            { id: "20240812", name: "2024-08-12" },
            { id: "20240813", name: "2024-08-13" },
            { id: "20240814", name: "2024-08-14" },
            { id: "20240815", name: "2024-08-15" },
            { id: "20240816", name: "2024-08-16" },
            { id: "20240817", name: "2024-08-17" },
            { id: "20240818", name: "2024-08-18" },
            { id: "20240819", name: "2024-08-19" },
            { id: "20240820", name: "2024-08-20" },
            { id: "20240821", name: "2024-08-21" },
            { id: "20240822", name: "2024-08-22" },
            { id: "20240823", name: "2024-08-23" },
            { id: "20240824", name: "2024-08-24" },
            { id: "20240825", name: "2024-08-25" },
            { id: "20240826", name: "2024-08-26" },
            { id: "20240827", name: "2024-08-27" },
            { id: "20240828", name: "2024-08-28" },
            { id: "20240829", name: "2024-08-29" },
            { id: "20240830", name: "2024-08-30" }
            
            
        ]; 
    return {
        ...requestValues,
        name: requestValues.requestName,
        dx: requestValues?.dxInfo.map(({ id }) => id),
        pe: '208104',
        ou: requestValues?.ouInfo.map(({ id }) => id),
        visualization: requestValues.visualizationLinked
            ? requestValues?.visualizationInfo?.id
            : null,
        filters: !filtersActuallyUsed ? [] : validFilters,
        filtersInfo: !filtersActuallyUsed ? null : requestValues.filtersInfo,
        visualizationInfo: !requestValues.visualizationLinked
            ? null
            : requestValues.visualizationInfo,
        inputIdScheme: SCHEME_TYPES.uid,
        ...getFormIdSchemeValues({
            requestValues,
            outputDataItemIdSchemeAvailable,
        }),
    }
}

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

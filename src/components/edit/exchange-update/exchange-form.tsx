import i18n from '@dhis2/d2-i18n'
import { Box, NoticeBox, ReactFinalForm } from '@dhis2/ui'
import classNames from 'classnames'
import PropTypes from 'prop-types'
import React, { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { AttributeProvider, useAppContext } from '../../../context/index'
import { Loader } from '../../common/index'
import { RequestForm } from '../request-update/index'
import { EditItemFooter, EditTitle } from '../shared/index'
import { ExchangeFormContents } from './exchange-form-contents'
import styles from './exchange-form.module.css'
import { getInitialValuesFromExchange } from './getExchangeValues'
import { useRequests } from './useRequests'
import { useUpdateExchange } from './useUpdateExchange'

const { Form } = ReactFinalForm

const formatError = (error) => {
    if (error.details?.response?.errorReports?.length > 0) {
        return error.details.response.errorReports.reduce(
            (stringified, rep) => {
                if (rep.message) {
                    return stringified + `\n${rep.message}`
                }
                return stringified
            },
            ''
        )
    }
    return error?.message
}

export const ExchangeForm = ({ exchangeInfo, addMode }) => {
    const {
        requestEditInfo,
        setRequestEditMode,
        exitRequestEditMode,
        requestsState,
        requestsDispatch,
        deleteRequest,
        requestsTouched,
        setRequestsTouched,
    } = useRequests({ exchangeInfo })

    const { refetchExchanges } = useAppContext()
    const navigate = useNavigate()
    const onComplete = useCallback(async () => {
        await refetchExchanges()
        navigate('/edit')
    }, [refetchExchanges, navigate])

    const [saveExchange, { loading: saving, error: error }] = useUpdateExchange(
        { onComplete }
    )

    return (
        <AttributeProvider>
            <Form
                onSubmit={(values, form) => {
                    saveExchange({
                        values,
                        form,
                        id: exchangeInfo?.id,
                        requests: requestsState,
                        requestsTouched,
                        newExchange: addMode,
                    })
                }}
                initialValues={getInitialValuesFromExchange({ exchangeInfo })}
            >
                {({ handleSubmit }) => (
                    <>
                        <div
                            className={classNames(styles.fullHeight, {
                                [styles.hidden]: requestEditInfo?.editMode,
                            })}
                        >
                            <div className={styles.editArea}>
                                <div className={styles.editContainer}>
                                    <EditTitle
                                        title={
                                            addMode
                                                ? i18n.t('Add exchange')
                                                : i18n.t('Edit exchange')
                                        }
                                    />

                                    <Box className={styles.editFormArea}>
                                        {saving && <Loader />}
                                        {error && (
                                            <NoticeBox
                                                error
                                                title={i18n.t('Could not save')}
                                                className={
                                                    styles.errorBoxContainer
                                                }
                                            >
                                                {formatError(error)}
                                            </NoticeBox>
                                        )}
                                        {!saving && (
                                            <ExchangeFormContents
                                                requestsState={requestsState}
                                                setRequestEditMode={
                                                    setRequestEditMode
                                                }
                                                deleteRequest={deleteRequest}
                                            />
                                        )}
                                    </Box>
                                </div>
                            </div>
                            <footer className={styles.bottomBar}>
                                <EditItemFooter
                                    handleSubmit={handleSubmit}
                                    requestsTouched={requestsTouched}
                                />
                            </footer>
                        </div>
                        {!requestEditInfo.editMode ? null : (
                            <div
                                className={classNames(styles.fullHeight, {
                                    [styles.hidden]: !requestEditInfo.editMode,
                                })}
                            >
                                <RequestForm
                                    exitRequestEditMode={exitRequestEditMode}
                                    request={requestEditInfo.request}
                                    requestsDispatch={requestsDispatch}
                                    addModeRequest={
                                        requestEditInfo.addModeRequest
                                    }
                                    setRequestsTouched={setRequestsTouched}
                                />
                            </div>
                        )}
                    </>
                )}
            </Form>
        </AttributeProvider>
    )
}

ExchangeForm.propTypes = {
    addMode: PropTypes.bool,
    exchangeInfo: PropTypes.object,
}

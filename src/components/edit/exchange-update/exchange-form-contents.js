import i18n from '@dhis2/d2-i18n'
import {
    Box,
    Button,
    Field as FieldContainer,
    InputFieldFF,
    RadioFieldFF,
    ReactFinalForm,
    hasValue,
    SingleSelectField, 
    SingleSelectOption 
} from '@dhis2/ui'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import React, { useMemo, useState } from 'react'
import { Warning } from '../../common/index.js'
import {
    SchemeSelector,
    Subsection,
    AUTHENTICATION_TYPES,
    EXCHANGE_TYPES,
} from '../shared/index.js'
import styles from './exchange-form-contents.module.css'
import { RequestsOverview } from './requests-overview.js'

const { Field, useField } = ReactFinalForm

const EnableExternalEditWarning = ({
    editTargetSetupDisabled,
    setEditTargetSetupDisabled,
    targetSetup,
}) =>
    editTargetSetupDisabled ? null : (
        <Warning>
            <div>
                {targetSetup
                    ? i18n.t(
                          'Editing the target setup will require you to reenter authentication details.'
                      )
                    : i18n.t(
                          'Editing the input ID scheme options will require you to reenter authentication details.'
                      )}
            </div>
            <Button
                className={styles.editWarningButton}
                small
                onClick={() => setEditTargetSetupDisabled(false)}
            >
                {targetSetup
                    ? i18n.t('Edit target setup')
                    : i18n.t('Edit input ID scheme options')}
            </Button>
        </Warning>
    )

EnableExternalEditWarning.propTypes = {
    editTargetSetupDisabled: PropTypes.bool,
    setEditTargetSetupDisabled: PropTypes.func,
    targetSetup: PropTypes.bool,
}

const RadioDecorator = ({ label, helperText, currentSelected, children }) => (
    <Box
        className={classnames(styles.radioBox, {
            [styles.radioBoxSelected]: currentSelected,
        })}
    >
        <div>{children}</div>
        <div className={styles.radioBoxText}>
            <span className={styles.radioDecoratorLabel}>{label}</span>
            <span className={styles.radioDecoratorHelper}>{helperText}</span>
        </div>
    </Box>
)

RadioDecorator.propTypes = {
    children: PropTypes.node,
    currentSelected: PropTypes.bool,
    helperText: PropTypes.string,
    label: PropTypes.string,
}

export const ExchangeFormContents = React.memo(
    ({ requestsState, setRequestEditMode, deleteRequest }) => {
        const { input: typeInput } = useField('type', {
            subscription: { value: true },
        })
        const { value: typeValue } = typeInput

        const { input: authenticationType } = useField('authentication', {
            subscription: { value: true },
        })
        const { value: authenticationValue } = authenticationType

        const [editTargetSetupDisabled, setEditTargetSetupDisabled] = useState(
            () => typeValue === EXCHANGE_TYPES.external
        )

        return (
            <>
                
                    <Subsection
                        text={i18n.t('Target setup')}
                        dataTest="target-setup"
                    >
                        {/* <EnableExternalEditWarning
                            editTargetSetupDisabled={editTargetSetupDisabled}
                            setEditTargetSetupDisabled={
                                setEditTargetSetupDisabled
                            }
                            targetSetup={true}
                        /> */}
                        <div
                            className={styles.subsectionField600}
                            data-test="exchange-url"
                        >
                        
                           
                            <Field
                                name="url"
                                label={i18n.t('Target URL')}
                                // validate={hasValue}
                            >
                                {({ input, meta }) => (
                                    
                                    <SingleSelectField
                                        label={i18n.t('Target URL')}
                                        selected={input.value || 'https://hmis.gov.np/hmis'}
                                        placeholder="Please select target url"
                                        onChange={({ selected }) => input.onChange(selected)}
                                        style={{width:'300px'}}

                                    >
                                        <SingleSelectOption 
                                            value="https://hmis.gov.np/hmis"
                                            label={i18n.t('HMIS System: https://hmis.gov.np/hmis')}
                                        />

                                        <SingleSelectOption
                                            value="https://hmis.amakomaya.com"
                                            label={i18n.t('Test System: https://hmis.amakomaya.com')}
                                        />
                                       {/* {meta.touched && meta.error && (
                                                <span style={{ color: 'red', fontSize: '12px' }}>{meta.error}</span>
                                            )} */}
                                    </SingleSelectField>
                                )}
                            </Field>
                        
                        </div>

                        <div>
                            <FieldContainer
                                label={i18n.t('Authentication method')}
                            >
                                <div
                                    className={styles.radiosContainer}
                                    data-test="exchange-auth-method"
                                >
                                    <Field
                                        name="authentication"
                                        type="radio"
                                        component={RadioFieldFF}
                                        label={i18n.t('Basic')}
                                        value={AUTHENTICATION_TYPES.basic}
                                    />
                                    <Field
                                        name="authentication"
                                        className={styles.radioItem}
                                        type="radio"
                                        component={RadioFieldFF}
                                        label={i18n.t('Personal Access token')}
                                        value={AUTHENTICATION_TYPES.pat}
                                    />
                                </div>
                            </FieldContainer>
                            {authenticationValue === AUTHENTICATION_TYPES.pat && (
                            <div
                                className={styles.subsectionField600}
                                data-test="exchange-auth-pat"
                            >
                                <Field
                                    name="accessToken"
                                    type="password"
                                    className={styles.fieldItem}
                                    label={i18n.t('Access token')}
                                    // helpText={i18n.t(
                                    //     'The personal access token generated by target instance'
                                    // )}
                                    component={InputFieldFF}
                                    validate={
                                         hasValue
                                            
                                    }
                                />
                            </div>
                        )}
                        {authenticationValue === AUTHENTICATION_TYPES.basic && (
                            <div
                                className={styles.subsectionField600}
                                data-test="exchange-auth-basic"
                            >
                                <Field
                                    name="username"
                                    className={styles.fieldItem}
                                    label={i18n.t('Username')}
                                    // helpText={i18n.t(
                                    //     'The username to log in to the target instance'
                                    // )}
                                    // disabled={editTargetSetupDisabled}
                                    component={InputFieldFF}
                                    validate={
                                       hasValue
                                            
                                    }
                                />
                                <Field
                                    name="password"
                                    className={styles.fieldItem}
                                    label={i18n.t('Password')}
                                    type="password"
                                    // helpText={i18n.t(
                                    //     'The password associated with the username specified above'
                                    // )}
                                    // disabled={editTargetSetupDisabled}
                                    component={InputFieldFF}
                                    validate={
                                        hasValue
                                    }
                                />
                            </div>
                        )}
                        </div>

                       
                    </Subsection>
             
                <Subsection text={i18n.t('Request')} >
                    <RequestsOverview
                        requestsInfo={useMemo(
                            () =>
                                requestsState.map((r, index) => ({
                                    ...r,
                                    index,
                                })),
                            [requestsState]
                        )}
                        // redo this logic ^ (move to RequestsOverview to not need memoization)

                        setRequestEditMode={setRequestEditMode}
                        deleteRequest={deleteRequest}
                    />

                </Subsection>


                
            </>
        )
    }
)

ExchangeFormContents.propTypes = {
    deleteRequest: PropTypes.func,
    requestsState: PropTypes.array,
    setRequestEditMode: PropTypes.func,
}

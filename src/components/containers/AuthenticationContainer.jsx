import React from 'react'

import { compose, withHandlers, withStateHandlers } from 'recompose'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'

import Grid from '@material-ui/core/Grid'
import { LoginForm } from '../ui/LoginForm'
import { PasswordRecoverForm } from '../ui/PasswordRecoverForm'
import { RegisterForm } from '../ui/RegisterForm'
import Typography from '@material-ui/core/Typography'

import { withFieldWatcher } from '@liquid-labs/react-validation'
import { withRouter } from 'react-router-dom'

import { contextActions } from '@liquid-labs/catalyst-core-ui'
import { fireauth } from '@liquid-labs/catalyst-firewrap'
import qs from 'query-string'

const LOGIN_VIEW = 'login'
const REGISTER_VIEW = 'register'
const RECOVER_PASSWORD_VIEW = 'recover'

const AuthenticationViewRouter = ({view, xs, onLogin, onRecoverPassword, onRegister, remoteError, ...formProps}) => {
  const onSubmit = view === LOGIN_VIEW
    ? onLogin
    : view === RECOVER_PASSWORD_VIEW
      ? onRecoverPassword
      : onRegister

  return (
    <Grid component="form" container spacing={16} item alignContent="flex-start" xs={xs} onSubmit={onSubmit}>
      { remoteError /* TODO: this is superceded by the core info thing */
        ? <Grid item xs={12}>
          <Typography color="error">{remoteError.message}</Typography>
        </Grid>
        : null }
      { view === LOGIN_VIEW && <LoginForm {...formProps} /> }
      { view === RECOVER_PASSWORD_VIEW && <PasswordRecoverForm {...formProps} /> }
      { view === REGISTER_VIEW && <RegisterForm {...formProps} /> }
    </Grid>
  )
}

AuthenticationViewRouter.propTypes = {
  view              : PropTypes.oneOf([LOGIN_VIEW, REGISTER_VIEW, RECOVER_PASSWORD_VIEW]).isReqired,
  xs                : PropTypes.oneOf([1,2,3,4,5,6,7,8,9,10,11,12]),
  onLogin           : PropTypes.func.isRequired,
  onRecoverPassword : PropTypes.func.isRequired,
  onRegister        : PropTypes.func.isRequired,
  remoteError       : PropTypes.object // TODO: placeholder until we switch to use global app info
}

const INITIAL_STATE = {
  view           : LOGIN_VIEW,
  username       : '',
  email          : '',
  password       : '',
  passwordVerify : '',
  remoteError    : null,
}

const mapDispatchToProps = (dispatch) => ({
  resetContext : () => dispatch(contextActions.resetContext())
})

const extractValue = (event) => {
  const target = event.target
  return target.type === 'checkbox'
    ? (!!target.checked)
    : target.value
}

const AuthenticationContainer = compose(
  withRouter,
  withFieldWatcher(),
  connect(null, mapDispatchToProps),
  withStateHandlers(
    INITIAL_STATE,
    {
      setView              : () => (view) => ({ view : view }),
      usernameChange       : () => (event) => ({ username : extractValue(event) }),
      emailChange          : () => (event) => ({ email : extractValue(event) }),
      passwordChange       : () => (event) => ({ password : extractValue(event) }),
      passwordVerifyChange : () => (event) => ({ passwordVerify : extractValue(event) }),
      setRemoteError       : () => (error) => ({ remoteError : error }),
      resetAuthentication  : () => () => INITIAL_STATE,
    },
  ),
  withHandlers({
    showLogin : ({setView}) => (event) => {
      setView(LOGIN_VIEW)
      event.preventDefault()
    },
    showRegister : ({setView}) => (event) => {
      setView(REGISTER_VIEW)
      event.preventDefault()
    },
    showRecoverPassword : ({setView}) => (event) => {
      setView(RECOVER_PASSWORD_VIEW)
      event.preventDefault()
    },
    postAuthPush : ({defaultPostAuthDestination, history, location}) => () => {
      const postLoginPath = qs.parse(location.search).postLoginPath
      const destination = postLoginPath
        ? postLoginPath
        : defaultPostAuthDestination
          ? defaultPostAuthDestination
          : null
      if (destination) {
        history.push(destination)
      }
    }
  }),
  withHandlers({
    onLogin : ({email, password, history, resetAuthentication, postAuthPush, resetContext, setRemoteError}) => (event) => {
      fireauth.loginWithEmailAndPassword(email, password)
        .then(() => {
          resetAuthentication()
          resetContext()
          postAuthPush()
        })
        .catch(error => {
          setRemoteError(error)
        });

      event.preventDefault()
    },
    onRecoverPassword : ({email, setRemoteError, resetAuthentication}) => (event) => {
      fireauth.sendPasswordResetEmail(email)
        .then(() => {
          resetAuthentication()
        })
        .catch(error => {
          setRemoteError(error)
        });

      event.preventDefault()
    },
    onRegister : ({username, email, password, resetAuthentication, resetContext, setRemoteError, postAuthPush, history}) => (event) => {
      fireauth.createUserWithEmailAndPassword(email, password, username)
        .then(() => {
          resetAuthentication()
          resetContext()
          postAuthPush()
        })
        .catch(error => {
          setRemoteError(error)
        })

      event.preventDefault()
    },
  })
)(AuthenticationViewRouter)

AuthenticationContainer.propTypes = {
  defaultPostAuthDestination : PropTypes.string,
  history                    : PropTypes.object.isRequired,
  location                   : PropTypes.object.isRequired,
  resetContext               : PropTypes.func.isRequired,
  fieldWatcher               : PropTypes.object.isRequired
}

export { AuthenticationContainer }

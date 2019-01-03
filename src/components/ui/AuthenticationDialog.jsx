import React from 'react'
import PropTypes from 'prop-types'
import { compose } from 'recompose'

import { AuthenticationContainer } from '../containers/AuthenticationContainer'
import Dialog from '@material-ui/core/Dialog'
import DialogContent from '@material-ui/core/DialogContent'
import Grid from '@material-ui/core/Grid'

import withMobileDialog from '@material-ui/core/withMobileDialog'
import withSizes from 'react-sizes'
import { withStyles } from '@material-ui/core/styles'

import classNames from 'classnames'

// This is set in the theme JSS
const dialogPadding = 48
const portraitSidePadding = 24 // ditto
const landscapeSidePadding = 8 // this is combineReducers

const styles = {
  flushTop : {
    '&:first-child' : {
      paddingTop : 0
    }
  },
  landscapePadding : {
    padding : `${landscapeSidePadding}px 0`
  }
}

const AuthenticationDialogBase = ({fullScreen, layoutDirection, logoSize, maxWidth, logoWidth, open, classes, ...formProps}) => {

  const logoUrl = logoSize === 'large'
    ? "https://liquid-labs.com/static/img/app/liquid-labs-login-tall.svg"
    : layoutDirection === 'portrait'
      ? "https://liquid-labs.com/static/img/landing/liquid-labs-logo-landscape.svg"
      : "https://liquid-labs.com/static/img/landing/liquid-labs-logo-portrait.svg"

  return (
    <Dialog fullScreen={fullScreen} open maxWidth={maxWidth}>
      <DialogContent className={classNames(classes.flushTop, layoutDirection === 'landscape' && classes.landscapePadding)}>
        <Grid container spacing={0} direction={layoutDirection === 'portrait' ? 'column' : 'row'}>
          <Grid item xs={layoutDirection === 'portrait' ? 12 : logoSize === 'large' ? 6 : 2} style={{textAlign : 'center'}}>
            <img style={{width : logoWidth, height : 'auto'}} src={logoUrl} />
          </Grid>
          <AuthenticationContainer xs={layoutDirection === 'portrait' ? 12 : logoSize === 'large' ? 6 : 10} />
        </Grid>
      </DialogContent>
    </Dialog>
  )
}

AuthenticationDialogBase.propTypes = {
  fullScreen      : PropTypes.bool,
  layoutDirection : PropTypes.oneOf(['landscape', 'portrait']),
  logoSize        : PropTypes.oneOf(['small', 'large']),
  // TODO: use CSS regex
  maxWidth        : PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  logoWidth       : PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  open            : PropTypes.bool.isRequired,
  classes         : PropTypes.object
}

const mapScreenSizeToType = ({ width, height }) => {
  const layoutInfo = {
    fullScreen      : false,
    layoutDirection : 'portrait',
    logoSize        : 'large',
    maxWidth        : 'xs',
    logoWidth       : '100%'
  }

  const formHeight = 260 // this is the min height of the login stuff
  const nominalSmallLogoMinHeight = 140
  const nominalSmallLogoWidth = 369
  const shortModeHeight = 300
  const intermediateHeight = 628
  const landscapeThreshold = 560
  const thinModeThreshold = 360

  if (height <= shortModeHeight) {
    layoutInfo.fullScreen = true
    if (width >= landscapeThreshold) {
      layoutInfo.layoutDirection = 'landscape'
    }
    else {
      layoutInfo.logoSize = 'small'
    }
  }
  else if (height <= intermediateHeight) {
    if (width > landscapeThreshold) {
      layoutInfo.layoutDirection = 'landscape'
      layoutInfo.maxWidth = 'md'
      if (height < formHeight + 2 * dialogPadding) {
        layoutInfo.fullScreen = true
      }
    }
    else {
      layoutInfo.logoSize = 'small'
      if (height < formHeight + nominalSmallLogoMinHeight + 2 * dialogPadding) {
        layoutInfo.fullScreen = true
      }
    }
  }
  else if (thinModeThreshold < 360) {
    layoutInfo.fullScreen = true
  }

  const windowPadding = layoutInfo.fullScreen ? 0 : dialogPadding
  if (layoutInfo.layoutDirection === 'landscape') {
    const logoSpaceWidth = (width - windowPadding*2 - landscapeSidePadding) / 2
    const logoSpaceHeight = Math.max(height - windowPadding*2, formHeight)
    const logoSpaceAspectRatio = logoSpaceWidth / logoSpaceHeight
    const logoAspectRatio = 1000/889

    if (logoSpaceAspectRatio > logoAspectRatio) {
      layoutInfo.logoWidth = `${(logoSpaceHeight * logoAspectRatio)/logoSpaceWidth*100}%`
    }
  }
  else if (layoutInfo.logoSize === 'small') {
    const availableWidth = width - windowPadding * 2 - portraitSidePadding * 2
    if (availableWidth < nominalSmallLogoWidth) {
      layoutInfo.logoWidth = `${availableWidth/nominalSmallLogoWidth*100}%`
    }
    else {
      layoutInfo.logoWidth = 'auto'
    }
  }


  return layoutInfo
}

export const AuthenticationDialog = compose(
  withStyles(styles, { name : 'AuthenticationDialog' }),
  withMobileDialog(),
  withSizes(mapScreenSizeToType)
)(AuthenticationDialogBase)

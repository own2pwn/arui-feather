/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* eslint-disable class-methods-use-this-regexp/class-methods-use-this */


import { autobind } from 'core-decorators';
import React from 'react';
import Type from 'prop-types';

import Icon from '../icon/icon';
import IconButton from '../icon-button/fantasy';
import RenderInContainer from '../render-in-container';
import PopupContainerProvider from '../popup-container-provider/popup-container-provider';

import keyboardCode from '../lib/keyboard-code';
import { isEventOutsideClientBounds } from '../lib/window';

import cn from '../cn';
import Mq from '../mq';
import performance from '../performance';

let savedScrollPosition;

/**
 * Восстанавливает исходную позацию скролла
 * после закрытия холодильника на мобильной версии.
 */
function setCurrentPosition() {
    document.body.style.top = `-${savedScrollPosition}px`;
    document.body.scrollTop = savedScrollPosition;
}

/**
 * Изменяет класс для body. Нужен для управления скроллом
 * основного экрана при показе холодильника.
 *
 * @param {Boolean} visible Признак видимости сайдбара.
 */
function setBodyClass(visible) {
    document.body.classList[visible ? 'add' : 'remove']('sidebar-visible');
    setCurrentPosition();
}

/**
 * Компонент боковой панели aka холодильник.
 */
@cn('sidebar')
@performance()
class Sidebar extends React.Component {
    static propTypes = {
        /** Тема компонента */
        theme: Type.oneOf(['alfa-on-color', 'alfa-on-white']),
        /** Дополнительный класс */
        className: Type.oneOfType([Type.func, Type.string]),
        /** Идентификатор компонента в DOM */
        id: Type.string,
        /** Дочерние компоненты */
        children: Type.oneOfType([Type.arrayOf(Type.node), Type.node]),
        /** Признак для отрисовки элемента закрытия */
        hasCloser: Type.bool,
        /** Признак для отрисовки оверлея */
        hasOverlay: Type.bool,
        /** Признак для того чтобы всегда показывать бордер в шапке холодильника */
        alwaysHasBorder: Type.bool,
        /** Признак появления холодильника */
        visible: Type.bool.isRequired,
        /** Контент в шапке сайтбара */
        headerContent: Type.node,
        /** Обработчик клика на элемент закрытия */
        onCloserClick: Type.func
    };

    static defaultProps = {
        hasOverlay: true,
        overlayClassName: '',
        alwaysHasBorder: false,
        hasCloser: true,
        autoclosable: true
    };

    state = {
        hasBorder: false,
        isMobile: false
    };

    sidebarHeader;
    sidebarContent;

    componentDidMount() {
        setBodyClass(this.props.visible);
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('scroll', this.handleScroll);
        window.addEventListener('click', this.handleWindowClick);
        this.sidebarContent.addEventListener('scroll', this.handleSidebarContentScroll);
    }

    componentWillReceiveProps(nextProps) {
        setBodyClass(nextProps.visible);
        if (nextProps.visible && this.props.hasOverlay) {
            document.body.classList.add('sidebar-overlay');
        } else {
            document.body.classList.remove('sidebar-overlay');
        }
    }

    componentWillUnmount() {
        setBodyClass(false);
        this.sidebarContent.removeEventListener('scroll', this.handleSidebarContentScroll);
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('scroll', this.handleScroll);
        window.removeEventListener('click', this.handleWindowClick);
    }

    render(cn) {
        const { hasCloser, children, visible, headerContent, hasOverlay } = this.props;

        return (
            <RenderInContainer
                className={ `${cn('overlay', {
                    visible: this.props.visible,
                })} ${this.props.overlayClassName}` }
            >
                <PopupContainerProvider className={ cn({ visible }) } >
                    <Mq
                        query='--small-only'
                        onMatchChange={ this.handleMqMatchChange }
                    />
                    <div
                        ref={ (elem) => { this.innerDomElement = elem; } }
                        className={ cn('inner') }
                        id={ this.props.id }
                    >
                        <header
                            className={ cn('header', { 'has-border': this.props.alwaysHasBorder || this.state.hasBorder }) }
                            ref={ (sidebarHeader) => { this.sidebarHeader = sidebarHeader; } }
                        >
                            {
                                hasCloser &&
                                <div className={ cn('closer') }>
                                    <IconButton
                                        size={ 'm' }
                                        onClick={ this.handleClose }
                                    >
                                        <Icon size={ 'm' } icon='close' />
                                    </IconButton>
                                </div>
                            }
                            {
                                headerContent
                                    ? this.renderHeaderContent(cn)
                                    : null
                            }
                        </header>
                        <div
                            className={ cn('content') }
                            ref={ (sidebarContent) => { this.sidebarContent = sidebarContent; } }
                        >
                            { children }
                        </div>
                        <footer className={ cn('footer') } />
                    </div>
                </PopupContainerProvider>
            </RenderInContainer>
        );
    }

    renderHeaderContent(cn) {
        return (
            <div className={ cn('header-content') }>
                { this.props.headerContent }
            </div>
        );
    }

    @autobind
    handleMqMatchChange(isMatched) {
        this.setState({ isMobile: isMatched });
    }

    @autobind
    handleClose() {
        if (this.props.onCloserClick) {
            if (this.state.isMobile) {
                document.body.scrollTop = savedScrollPosition;
            }
            this.props.onCloserClick();
        }
    }

    @autobind
    handleKeyDown(event) {
        switch (event.which) {
            case keyboardCode.ESCAPE:
                event.preventDefault();
                this.handleClose();
                break;
        }
    }

    @autobind
    handleSidebarContentScroll() {
        this.setState({ hasBorder: this.sidebarContent.scrollTop > this.sidebarHeader.offsetHeight });
    }

    handleScroll() {
        if (document.body.scrollTop !== 0) {
            savedScrollPosition = document.body.scrollTop;
        }
    }

    @autobind
    handleWindowClick(event) {
        console.log(isEventOutsideClientBounds(event, this.innerDomElement));
        if (this.props.autoclosable && isEventOutsideClientBounds(event, this.innerDomElement)) {
            this.handleClose();
        }
    }
}

export default Sidebar;

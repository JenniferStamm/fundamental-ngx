import {
    AfterContentInit,
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ComponentRef,
    ContentChildren,
    ElementRef,
    EventEmitter,
    Injector,
    Input,
    OnDestroy,
    OnInit,
    Optional,
    Output,
    QueryList,
    Renderer2,
    TemplateRef,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { MenuItemComponent } from './menu-item/menu-item.component';
import { MenuService } from './services/menu.service';
import { DynamicComponentService } from '@fundamental-ngx/core/utils';
import { MenuMobileComponent } from './menu-mobile/menu-mobile.component';
import { Subscription } from 'rxjs';
import { DialogConfig } from '@fundamental-ngx/core/dialog';
import { MobileModeConfig } from '@fundamental-ngx/core/mobile-mode';
import { RtlService } from '@fundamental-ngx/core/utils';
import { MENU_COMPONENT, MenuInterface } from './menu.interface';
import { BasePopoverClass } from '@fundamental-ngx/core/popover';
import { PopoverService } from '@fundamental-ngx/core/popover';
import { ContentDensityService } from '@fundamental-ngx/core/utils';

let menuUniqueId = 0;

/**
 * The component that represents a menu.
 */
@Component({
    selector: 'fd-menu',
    templateUrl: './menu.component.html',
    styleUrls: ['menu.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        MenuService,
        PopoverService
    ],
})
export class MenuComponent extends BasePopoverClass implements MenuInterface, AfterContentInit, AfterViewInit, OnDestroy, OnInit {

    /** Set menu in mobile mode */
    @Input('mobile')
    set setMobileMode(value: boolean) {
        this.mobile = value;
        this._menuService.setMenuMode(this.mobile);
    }

    /** Whether the popover is disabled. */
    @Input()
    disabled = false;

    /** Display menu in compact mode */
    @Input()
    compact?: boolean;

    /** Whether the popover should be focusTrapped. */
    @Input()
    focusTrapped = true;

    /** Open submenu on hover after given milliseconds */
    @Input()
    openOnHoverTime = 0;

    /** Display menu without integrated popover */
    @Input()
    mobileConfig: MobileModeConfig = { cancelButtonText: 'Cancel' };

    /** Aria-label for navigation */
    @Input()
    ariaLabel: string = null;

    /** Aria-Labelledby for element describing navigation */
    @Input()
    ariaLabelledby: string = null;

    /** Id of the control. */
    @Input()
    id = `fd-menu-${menuUniqueId++}`;

    /** Emits array of active menu items */
    @Output()
    readonly activePath: EventEmitter<MenuItemComponent[]> = new EventEmitter<MenuItemComponent[]>();

    /** @hidden Emits event when the menu is opened/closed */
    @Output()
    isOpenChange: EventEmitter<boolean> = new EventEmitter<boolean>();

    /** @hidden Reference to the menu root template */
    @ViewChild('menuRootTemplate')
    menuRootTemplate: TemplateRef<any>;

    /** @hidden Reference to all menu Items */
    @ContentChildren(MenuItemComponent, {descendants: true})
    menuItems: QueryList<MenuItemComponent>;

    /** Whether use menu in mobile mode */
    mobile = false;

    /** @hidden Whether Popover with the menu is opened */
    isOpen = false;

    /** @hidden Reference to external menu trigger */
    private _externalTrigger: ElementRef;

    /** @hidden */
    private _subscriptions: Subscription = new Subscription();

    /** @hidden */
    private _mobileModeComponentRef: ComponentRef<MenuMobileComponent>;

    /** @hidden */
    private _clickEventListener: Function;

    constructor(public elementRef: ElementRef,
                @Optional() public dialogConfig: DialogConfig,
                private _rendered: Renderer2,
                private _menuService: MenuService,
                private _changeDetectorRef: ChangeDetectorRef,
                private _popoverService: PopoverService,
                @Optional() private _contentDensityService: ContentDensityService,
                @Optional() private _rtlService: RtlService,
                @Optional() private _dynamicComponentService: DynamicComponentService) {
        super();
    }

    /** @hidden */
    ngOnInit(): void {
        if (this.compact === undefined && this._contentDensityService) {
            this._subscriptions.add(
                this._contentDensityService._contentDensityListener.subscribe((density) => {
                    this.compact = density !== 'cozy';
                })
            );
        }
    }

    /** @hidden */
    ngAfterContentInit(): void {
        this._menuService.setMenuRoot(this);
        this._listenOnMenuItemsChange();
    }

    /** @hidden */
    ngAfterViewInit(): void {
        this._menuService.setMenuMode(this.mobile)
        this._setupView();
    }

    /** @hidden */
    ngOnDestroy(): void {
        this._destroyMobileComponent();
        this._destroyEventListeners();
        this._menuService.onDestroy();
        this._subscriptions.unsubscribe();
        this._popoverService.onDestroy();
    }

    get trigger(): ElementRef {
        return this._externalTrigger;
    }

    set trigger(trigger: ElementRef) {
        this._externalTrigger = trigger;
        this._popoverService.initialise(this._externalTrigger);
        this._destroyEventListeners();
        this._listenOnTriggerRefClicks();
    }

    /** Opens the menu */
    open(): void {
        this.isOpen = true;
        this._popoverService.open();
        this.isOpenChange.emit(this.isOpen);
        this._changeDetectorRef.markForCheck();
    }

    /** Closes the menu */
    close(): void {
        this.isOpen = false;
        this._popoverService.close();
        this._menuService.resetMenuState();
        this.isOpenChange.emit(this.isOpen);
        this._focusTrigger();
        this._changeDetectorRef.markForCheck();
    }

    /** Toggles menu open/close state */
    toggle(): void {
        this.isOpen ? this.close() : this.open();
    }

    /** Method called to refresh position of opened popover */
    refreshPosition(): void {
        this._popoverService.refreshPosition();
    }

    /** @hidden Select and instantiate menu view mode */
    private _setupView(): void {
        if (this.mobile) {
            this._setupMobileMode();
        } else {
            this._setupPopoverService();
        }
        this._changeDetectorRef.detectChanges();
    }

    /** @hidden */
    private _setupPopoverService(): void {
        this._subscriptions.add(
            this._popoverService._onLoad.subscribe(elementRef =>
                this._manageKeyboardSupport(elementRef)
            )
        )

        this._popoverService.templateContent = this.menuRootTemplate;
        this._popoverService.initialise(this._externalTrigger, this);
    }

    /** @hidden */
    private _manageKeyboardSupport(elementRef: ElementRef): void {
        this._menuService.addKeyboardSupport(elementRef)
    }

    /** @hidden Open Menu in mobile mode */
    private _setupMobileMode(): void {
        this._mobileModeComponentRef = this._dynamicComponentService
            .createDynamicComponent<MenuMobileComponent>(
                this.menuRootTemplate,
                MenuMobileComponent,
                { container: this.elementRef.nativeElement },
                {
                    injector: Injector.create({providers: [{ provide: MENU_COMPONENT, useValue: this }]}),
                    services: [this._menuService, this._rtlService] }
            )
        ;

        this._listenOnTriggerRefClicks();
    }

    /** @hidden Listen on menu items change and rebuild menu */
    private _listenOnMenuItemsChange(): void {
        this._subscriptions.add(
             this.menuItems.changes.subscribe(() => this._menuService.rebuildMenu())
        );
       this.menuItems.forEach(m => {
             if (m.submenu && m.submenu.menuItems) {
                 this._subscriptions.add(m.submenu.menuItems.changes.subscribe(() => this._menuService.rebuildMenu()));
             }
         })
    }

    /**
     * @hidden
     * This is going to be removed in feature, on dialog and dynamic service component refactor
     */
    private _listenOnTriggerRefClicks(): void {
        this._destroyEventListeners();
        if (this.trigger && this.mobile) {
            this._clickEventListener = this._rendered.listen(
                this.trigger.nativeElement, 'click', () => this.toggle()
            );
        }
    }

    /**
     * @hidden
     * This is going to be removed in feature, on dialog and dynamic service component refactor
     */
    private _destroyEventListeners(): void {
        if (this._clickEventListener) {
            this._clickEventListener();
            this._clickEventListener = null;
        }
    }

    /** @hidden */
    private _destroyMobileComponent(): void {
        if (this._mobileModeComponentRef) {
            this._mobileModeComponentRef.destroy();
        }
    }

    /** @hidden */
    private _focusTrigger(): void {
        if (this.focusTrapped && this.trigger) {
            this.trigger.nativeElement.focus();
        }
    }
}

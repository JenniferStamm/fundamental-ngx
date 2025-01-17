import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';

import { TimelineModule } from '@fundamental-ngx/core/timeline';

describe('TimelineComponent', () => {
    let component: TimelineTestApp;
    let fixture: ComponentFixture<TimelineTestApp>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TimelineTestApp],
            imports: [TimelineModule]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TimelineTestApp);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should create nodes by dataSource', () => {
        const hostEl: HTMLElement = fixture.debugElement.nativeElement;
        const nodesCount = hostEl.querySelectorAll('.fd-timeline__node-wrapper').length;
        const dataSourceCount = component.data.length;
        expect(nodesCount).toBeGreaterThan(0);
        expect(nodesCount).toBe(dataSourceCount);
    });

    it('should rerender whole list without trackBy', () => {
        const nodesArr = getNodes(fixture.debugElement.nativeElement);
        nodesArr.forEach((node: Element, index: number) => {
            node.setAttribute('initialIndex', index.toString());
        });

        expect(nodesArr.length).toBe(component.data.length);

        component.data = [
            { title: 'Title #1' },
            { title: 'Title #2' },
            { title: 'Title #3' }
        ];
        fixture.detectChanges();

        const nodeWithInitialIndexAttr = getNodes(fixture.debugElement.nativeElement).filter((node: Element, index: number) => {
            return node.hasAttribute('initialIndex');
        });

        expect(nodeWithInitialIndexAttr.length).toBe(0);
    });
});

describe('TimelineComponentWithTrackBy', () => {
    let component: TimelineTestAppWithTrackBy;
    let fixture: ComponentFixture<TimelineTestAppWithTrackBy>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TimelineTestApp, TimelineTestAppWithTrackBy],
            imports: [TimelineModule]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TimelineTestAppWithTrackBy);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should cache existed items by trackBy function', () => {
        const nodesArr = getNodes(fixture.debugElement.nativeElement);
        nodesArr.forEach((node: Element, index: number) => {
            node.setAttribute('initialIndex', index.toString());
        });

        expect(nodesArr.length).toBe(component.data.length);

        component.data = [
            { title: 'Title #1' },
            { title: 'Title #2' },
            { title: 'Title #3' }
        ];
        fixture.detectChanges();

        const nodeWithInitialIndexAttr = getNodes(fixture.debugElement.nativeElement).filter((node: Element, index: number) => {
            return node.hasAttribute('initialIndex');
        });

        expect(nodeWithInitialIndexAttr.length).toBe(component.data.length);
    });
});

@Component({
    template: `
        <div style="width: 300px;">
            <fd-timeline [dataSource]="data">
                <fd-timeline-node *fdTimelineNodeDef="let node">
                    {{node.title}}
                </fd-timeline-node>
            </fd-timeline>
        </div>
    `
})
class TimelineTestApp {

    data = [
        { title: 'Title #1' },
        { title: 'Title #2' },
        { title: 'Title #3' }
    ];
}

@Component({
    template: `
        <div style="width: 300px;">
            <fd-timeline [dataSource]="data" [trackBy]="trackBy">
                <fd-timeline-node *fdTimelineNodeDef="let node">
                    {{node.title}}
                </fd-timeline-node>
            </fd-timeline>
        </div>
    `
})
class TimelineTestAppWithTrackBy extends TimelineTestApp {

    enableTrackBy = false;

    trackBy(index: number, item: any): string {
        return item.title;
    };
}

function getNodes(treeElement: Element): HTMLElement[] {
    return Array.from(treeElement.querySelectorAll('.fd-timeline__node-wrapper'));
}

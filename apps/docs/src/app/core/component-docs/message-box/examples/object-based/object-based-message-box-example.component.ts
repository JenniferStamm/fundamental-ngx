import { Component } from '@angular/core';

import { MessageBoxContent, MessageBoxService } from '@fundamental-ngx/core/message-box';

@Component({
    selector: 'fd-object-based-message-box-example',
    templateUrl: './object-based-message-box-example.component.html',
    providers: [
        // The MessageBoxService is already provided on the MessageBoxModule module.
        // We do it at the component level here, due to the limitations of our example generation script.
        MessageBoxService
    ]
})
export class ObjectBasedMessageBoxExampleComponent {
    constructor(private _messageBoxService: MessageBoxService) {}

    closeReason = '';

    open(): void {
        const content: MessageBoxContent = {
            title: 'Fruit facts',
            content: 'Strawberries have more vitamin C than oranges.',
            approveButton: 'Ok',
            cancelButton: 'Cancel',
            approveButtonCallback: () => messageBoxRef.close('Approved'),
            cancelButtonCallback: () => messageBoxRef.close('Canceled'),
            closeButtonCallback: () => messageBoxRef.dismiss('Dismissed')
        };

        const messageBoxRef = this._messageBoxService.open(content);

        messageBoxRef.afterClosed.subscribe(
            (result) => {
                this.closeReason = 'Message box closed with result: ' + result;
            },
            (error) => {
                this.closeReason = 'Message box dismissed with result: ' + error;
            }
        );
    }
}

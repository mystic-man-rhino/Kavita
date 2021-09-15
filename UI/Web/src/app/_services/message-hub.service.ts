import { EventEmitter, Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { User } from '@sentry/angular';
import { BehaviorSubject, ReplaySubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UpdateNotificationModalComponent } from '../shared/update-notification/update-notification-modal.component';
import { ScanLibraryEvent } from '../_models/events/scan-library-event';
import { ScanSeriesEvent } from '../_models/events/scan-series-event';

export enum EVENTS {
  UpdateAvailable = 'UpdateAvailable',
  ScanSeries = 'ScanSeries',
  ScanLibrary = 'ScanLibrary',
  RefreshMetadata = 'RefreshMetadata',
}

export interface Message<T> {
  event: EVENTS;
  payload: T;
}

@Injectable({
  providedIn: 'root'
})
export class MessageHubService {
  hubUrl = environment.hubUrl;
  private hubConnection!: HubConnection;
  private updateNotificationModalRef: NgbModalRef | null = null;

  private messagesSource = new ReplaySubject<Message<any>>(1);
  public messages$ = this.messagesSource.asObservable();

  public scanSeries: EventEmitter<ScanSeriesEvent> = new EventEmitter<ScanSeriesEvent>();
  public scanLibrary: EventEmitter<ScanLibraryEvent> = new EventEmitter<ScanLibraryEvent>();

  constructor(private modalService: NgbModal) { }

  createHubConnection(user: User) {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(this.hubUrl + 'messages', {
        accessTokenFactory: () => user.token
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection
    .start()
    .catch(err => console.error(err));

    this.hubConnection.on('receiveMessage', body => {
      //console.log('[Hub] Body: ', body);
    });

    this.hubConnection.on(EVENTS.ScanSeries, resp => {
      this.messagesSource.next({
        event: EVENTS.ScanSeries,
        payload: resp.body
      });
      this.scanSeries.emit(resp.body);
    });

    this.hubConnection.on(EVENTS.ScanLibrary, resp => {
      this.messagesSource.next({
        event: EVENTS.ScanLibrary,
        payload: resp.body
      });
      this.scanLibrary.emit(resp.body);
      // if ((resp.body as ScanLibraryEvent).stage === 'complete') {
      //   this.toastr.
      // }
    });

    this.hubConnection.on(EVENTS.UpdateAvailable, resp => {
      this.messagesSource.next({
        event: EVENTS.UpdateAvailable,
        payload: resp.body
      });
      // Ensure only 1 instance of UpdateNotificationModal can be open at once
      if (this.updateNotificationModalRef != null) { return; }
      this.updateNotificationModalRef = this.modalService.open(UpdateNotificationModalComponent, { scrollable: true, size: 'lg' });
      this.updateNotificationModalRef.componentInstance.updateData = resp.body;
      this.updateNotificationModalRef.closed.subscribe(() => {
        this.updateNotificationModalRef = null;
      });
      this.updateNotificationModalRef.dismissed.subscribe(() => {
        this.updateNotificationModalRef = null;
      });
    });
  }

  stopHubConnection() {
    this.hubConnection.stop().catch(err => console.error(err));
  }

  sendMessage(methodName: string, body?: any) {
    return this.hubConnection.invoke(methodName, body);
  }
  
}

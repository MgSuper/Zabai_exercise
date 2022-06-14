import { Component } from '@angular/core';

import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Storage } from '@capacitor/storage';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { FileOpener } from '@awesome-cordova-plugins/file-opener/ngx';
import { HttpService } from '../services/http.service';

export const FILE_KEY = 'files';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  downloadURL = '';
  myFiles = [];
  downloadProgress = 0;
  showLoader: boolean;

  zip_2mb = 'https://file-examples.com/wp-content/uploads/2017/02/zip_2MB.zip';
  zip_5mb = 'https://file-examples.com/wp-content/uploads/2017/02/zip_5MB.zip';
  zip_9mb = 'https://file-examples.com/wp-content/uploads/2017/02/zip_9MB.zip';
  zip_10mb = 'https://file-examples.com/wp-content/uploads/2017/02/zip_10MB.zip';
  mp4 = 'https://file-examples.com/wp-content/uploads/2017/04/file_example_MP4_640_3MG.mp4';


  constructor(private httpService: HttpService, private fileOpener: FileOpener, private http: HttpClient) {
    this.loadFiles();
  }

  showProgressBar() {
    this.showLoader = true;
  }

  hideProgressBar() {
    this.showLoader = false;
  }

  async loadFiles() {
    const videoList = await Storage.get({key: FILE_KEY});
    // Capacitor storage just plain text, we will store everything json stringified and then parse it back once we get it or set it to empty array.
    this.myFiles = JSON.parse(videoList.value) || [];
  }

  // Helper
  // if we want to store file with capacitor, we neet to store base64 string cause capacitor passes this information through bridge and store it in native device
  // and therefore we need a base64 string but the file we download will be a blob first and 
  // there's alse a capacitor community plugin to directly store a blob that you could use called capacitor-blob-writer
  private convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = FileReader;
    reader.prototype.onerror = reject;
    reader.prototype.onload = () => {
      resolve(reader.prototype.result);
    };
    reader.prototype.readAsDataURL(blob);
  });

  private getMimeType(name) {
    if (name.indexOf('zip')) {
      return 'zip/zip';
    } else if (name.indexOf('mp4')) {
      return 'video/mp4';
    }
  }

  downloadFile(url?) {
    this.showProgressBar();
    this.downloadURL = url ? url : this.downloadURL;
    this.http.get( this.downloadURL, {
      responseType: 'blob',
      reportProgress: true,
      observe: 'events',
    }).subscribe(async event => {
      console.log('event ', event);
      if (event.type === HttpEventType.DownloadProgress) {
        this.downloadProgress = Math.round((100 * event.loaded) / event.total);
        this.showProgressBar();
      } else if (event.type === HttpEventType.Response) {
        this.downloadProgress = 0;
        const name = this.downloadURL.substring(this.downloadURL.lastIndexOf('/') + 1);
      const base64 = await this.convertBlobToBase64(event.body) as string;
      const savedFile = await Filesystem.writeFile({
        path: name,
        data: base64,
        directory: Directory.Documents,
      });
      const path = savedFile.uri;
      const mimeType = this.getMimeType(name);

      this.fileOpener.open(path, mimeType)
      .then(() => console.log('File is opened !'))
      .catch(error => console.log('Error opening file', error));

      this.myFiles.unshift(path);
      Storage.set({
        key: FILE_KEY,
        value: JSON.stringify(this.myFiles),
      });
      }
      
    });
  }

  deleteFile(zip) {
    const name = zip.substring(zip.lastIndexOf('/') + 1);
    Filesystem.deleteFile({
      path: name,
      directory: Directory.Documents,
    });
    this.myFiles = this.myFiles.filter(filePath => filePath != zip);
    Storage.set({
      key: FILE_KEY,
      value: JSON.stringify(this.myFiles),
    });
  }


  async openFile(file) {
    const name = file.substring(file.lastIndexOf('/') + 1);
    const mimeType = this.getMimeType(name);
    this.fileOpener.showOpenWithDialog(file, mimeType)
      .then(() => console.log('File is opened !'))
      .catch(error => console.log('Error opening file', error));
  }

}

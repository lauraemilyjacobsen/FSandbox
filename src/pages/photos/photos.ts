import { Component } from '@angular/core';

import { Photo } from '../../models/photo';
import { FlickrService } from '../../services/flickr.service'

@Component({
  selector: 'page-photos',
  templateUrl: 'photos.html'
})
export class PhotosPage {

  photos: Photo[];

  constructor(private flickrService: FlickrService) {
    // Load photos.
    flickrService.getPhotos().subscribe(photos => {
      for(let photo of photos){ 
        photo.url_q = 'https://farm' + photo.farm +
            '.staticflickr.com/' + photo.server +
            '/' + photo.id + '_' + photo.secret + '_q.jpg';
      }
      this.photos = photos;
    });
  }
}
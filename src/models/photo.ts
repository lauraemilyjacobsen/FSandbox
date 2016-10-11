export class Photo {

    id: string;
    owner: string;
    secret: string;
    server: string;
    farm: number;
    title: string;
    url_q: string;

    // Get the URL to the photo at the size specified by the suffix.
    // s	small square 75x75
    // q	large square 150x150
    // t	thumbnail, 100 on longest side
    // m	small, 240 on longest side
    // n	small, 320 on longest side
    // -	medium, 500 on longest side ... etc

    getUrl(suffix: string) {
        return 'https://farm' + this.farm +
            '.staticflickr.com/' + this.server +
            '/' + this.id + '_' + this.secret + '_' + suffix + '.jpg';
    }
}
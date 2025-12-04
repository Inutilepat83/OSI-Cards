import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService],
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('GET requests', () => {
    it('should make GET request', (done) => {
      const mockData = { id: 1, name: 'Test' };

      service.get<typeof mockData>('/test').subscribe((data) => {
        expect(data).toEqual(mockData);
        done();
      });

      const req = httpMock.expectOne('/test');
      expect(req.request.method).toBe('GET');
      req.flush(mockData);
    });

    it('should handle GET errors', (done) => {
      service.get('/test').subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        },
      });

      const req = httpMock.expectOne('/test');
      req.error(new ProgressEvent('error'));
    });
  });

  describe('POST requests', () => {
    it('should make POST request', (done) => {
      const mockData = { id: 1 };
      const postData = { name: 'Test' };

      service.post<typeof mockData>('/test', postData).subscribe((data) => {
        expect(data).toEqual(mockData);
        done();
      });

      const req = httpMock.expectOne('/test');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(postData);
      req.flush(mockData);
    });
  });

  describe('Configuration', () => {
    it('should allow configuration', () => {
      service.configure({
        baseUrl: 'https://api.example.com',
        timeout: 5000,
        retries: 5,
      });

      // Configuration applied (internal state)
      expect(service).toBeTruthy();
    });

    it('should build full URL with baseUrl', (done) => {
      service.configure({ baseUrl: 'https://api.example.com' });

      service.get('/test').subscribe(() => done());

      const req = httpMock.expectOne('https://api.example.com/test');
      req.flush({});
    });
  });
});

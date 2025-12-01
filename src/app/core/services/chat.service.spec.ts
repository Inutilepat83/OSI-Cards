import { TestBed } from '@angular/core/testing';
import { ChatService, ChatMessage } from './chat.service';
import { LoggingService } from './logging.service';

describe('ChatService', () => {
  let service: ChatService;
  let loggingService: jasmine.SpyObj<LoggingService>;

  beforeEach(() => {
    const loggingSpy = jasmine.createSpyObj('LoggingService', ['info']);

    TestBed.configureTestingModule({
      providers: [
        ChatService,
        { provide: LoggingService, useValue: loggingSpy }
      ]
    });
    service = TestBed.inject(ChatService);
    loggingService = TestBed.inject(LoggingService) as jasmine.SpyObj<LoggingService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('sendMessage', () => {
    it('should add message to history', (done) => {
      service.sendMessage('Hello, agent!');
      
      service.messages$.subscribe(messages => {
        expect(messages.length).toBe(1);
        expect(messages[0].text).toBe('Hello, agent!');
        expect(messages[0].sender).toBe('user');
        expect(messages[0].id).toBeTruthy();
        expect(messages[0].timestamp).toBeInstanceOf(Date);
        done();
      });
    });

    it('should log message sent', () => {
      service.sendMessage('Test message');
      
      expect(loggingService.info).toHaveBeenCalledWith(
        'User message sent',
        'ChatService',
        jasmine.any(Object)
      );
    });

    it('should include metadata when provided', (done) => {
      const metadata = { source: 'test', priority: 'high' };
      service.sendMessage('Test', metadata);
      
      service.messages$.subscribe(messages => {
        expect(messages[0].metadata).toEqual(metadata);
        done();
      });
    });
  });

  describe('addMessage', () => {
    it('should add message to history', (done) => {
      const message: ChatMessage = {
        id: 'msg-1',
        sender: 'agent',
        text: 'Response message',
        timestamp: new Date()
      };
      
      service.addMessage(message);
      
      service.messages$.subscribe(messages => {
        expect(messages.length).toBe(1);
        expect(messages[0]).toEqual(message);
        done();
      });
    });

    it('should append to existing messages', (done) => {
      service.sendMessage('First message');
      service.sendMessage('Second message');
      
      service.messages$.subscribe(messages => {
        expect(messages.length).toBe(2);
        expect(messages[0].text).toBe('First message');
        expect(messages[1].text).toBe('Second message');
        done();
      });
    });
  });

  describe('clearHistory', () => {
    it('should clear all messages', (done) => {
      service.sendMessage('Message 1');
      service.sendMessage('Message 2');
      service.clearHistory();
      
      service.messages$.subscribe(messages => {
        expect(messages.length).toBe(0);
        done();
      });
    });

    it('should log history cleared', () => {
      service.clearHistory();
      
      expect(loggingService.info).toHaveBeenCalledWith(
        'Chat history cleared',
        'ChatService'
      );
    });
  });
});












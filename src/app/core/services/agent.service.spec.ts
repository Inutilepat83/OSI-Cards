import { TestBed } from '@angular/core/testing';
import { AgentService } from './agent.service';
import { LoggingService } from './logging.service';

describe('AgentService', () => {
  let service: AgentService;
  let loggingService: jasmine.SpyObj<LoggingService>;

  beforeEach(() => {
    const loggingSpy = jasmine.createSpyObj('LoggingService', ['info', 'error']);

    TestBed.configureTestingModule({
      providers: [
        AgentService,
        { provide: LoggingService, useValue: loggingSpy }
      ]
    });
    service = TestBed.inject(AgentService);
    loggingService = TestBed.inject(LoggingService) as jasmine.SpyObj<LoggingService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('triggerAgent', () => {
    it('should log agent trigger with ID', () => {
      service.triggerAgent('agent-123');
      
      expect(loggingService.info).toHaveBeenCalledWith(
        'Agent triggered: agent-123',
        'AgentService',
        { context: undefined }
      );
    });

    it('should log agent trigger with context', () => {
      const context = { query: 'show sales data', userId: 'user-1' };
      service.triggerAgent('agent-123', context);
      
      expect(loggingService.info).toHaveBeenCalledWith(
        'Agent triggered: agent-123',
        'AgentService',
        { context }
      );
    });
  });

  describe('processAgentResponse', () => {
    it('should log agent response', () => {
      const response = { data: 'test response' };
      service.processAgentResponse('agent-123', response);
      
      expect(loggingService.info).toHaveBeenCalledWith(
        'Agent response received from agent-123',
        'AgentService',
        { response }
      );
    });
  });

  describe('handleAgentError', () => {
    it('should log agent error', () => {
      const error = new Error('Agent failed');
      service.handleAgentError('agent-123', error);
      
      expect(loggingService.error).toHaveBeenCalledWith(
        'Error interacting with agent agent-123',
        'AgentService',
        { error }
      );
    });
  });
});












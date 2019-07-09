import {Component, HostBinding, ViewChild, ElementRef} from "@angular/core";
import {UpgradableComponent} from "theme/components/upgradable";
import {
  ResultMessage,
  ConfigService,
  TypeService,
  RequirementTypes,
  PluginType,
  APIAndSpecificType,
  SubTypes,
  ConnectorService,
  InstanceService,
  ConnectorKey,
  ConnectorDetails,
  ConnectorRef,
  CredentialsEntry,
  EncryptedKeyValuePair,
  PluginInstance,
  PluginInstanceRef,
  Requirement,
  RequirementInfo,
  PluginLogMessageDTO
} from "chatoverflow-api";
import {CryptoService} from "../../../crypto.service";

interface PluginInstanceWithLog extends PluginInstance {
  log?: string[];
}

@Component({
  selector: 'better-repl',
  templateUrl: './betterrepl.component.html',
  styleUrls: ['./betterrepl.css']
})
export class BetterREPLComponent extends UpgradableComponent {
  @HostBinding('class.mdl-grid') private readonly mdlGrid = true;
  @ViewChild('instanceLog') private readonly instanceLog: ElementRef<HTMLDivElement>;

  private lastRequestCommand = "...";
  private lastRequestMessage = "Please send a request to the server...";
  private lastRequestSuccessful = true;

  private authKey = "";
  private lastPassword = "";

  private connectorTypes: Array<string>;
  private requirementTypes: RequirementTypes;
  private pluginTypes: Array<PluginType>;

  private connectorKeys: Array<ConnectorKey>;
  private pluginInstances: Array<PluginInstanceWithLog>;

  private instanceLogOutput: Array<string>;
  private instanceRequirements: Array<Requirement>;

  private mcSourceIdentifierValue = "";
  private mcConnectorTypeValue = "";
  private mcrSourceIdentifierValue = "";
  private mcrConnectorTypeValue = "";

  private instanceNameSSValue = "";
  private miPluginNameValue = "";
  private miPluginAuthorValue = "";
  private miInstanceNameValue = "";
  private requirementsInstanceNameValue = "";

  private changeReqInstanceNameValue = "";
  private changeReqIDValue = "";
  private changeReqTypeValue = "";
  private changeReqValueValue = "";

  private eventsStarted = false;
  private eventSource: EventSource = null;

  constructor(private configService: ConfigService, private typeService: TypeService,
              private connectorService: ConnectorService, private instanceService: InstanceService,
              private cryptoService: CryptoService) {
    super();
  }

  reloadEverything(clearForms: boolean) {
    if (clearForms) {
      this.authKey = "";
      this.instanceLogOutput = [];
      this.instanceRequirements = [];

      this.mcSourceIdentifierValue = "";
      this.mcConnectorTypeValue = "";
      this.mcrSourceIdentifierValue = "";
      this.mcrConnectorTypeValue = "";

      this.instanceNameSSValue = "";
      this.miPluginNameValue = "";
      this.miPluginAuthorValue = "";
      this.miInstanceNameValue = "";
      this.requirementsInstanceNameValue = "";

      this.changeReqInstanceNameValue = "";
      this.changeReqIDValue = "";
      this.changeReqTypeValue = "";
      this.changeReqValueValue = "";

      this.connectorTypes = [];
      this.requirementTypes = null;
      this.pluginTypes = [];
      this.pluginInstances = [];
      this.connectorKeys = [];

    } else {

      this.requestTypes();
      this.getRegisteredConnectors();
      this.getInstances();
    }

  }

  requestTypes() {
    this.connectorTypes = [];
    this.requirementTypes = null;
    this.pluginTypes = [];

    this.typeService.getConnectorType(this.authKey).subscribe((response: Array<string>) => {
      this.logRequest("getConnectorType", true, JSON.stringify(response));
      this.connectorTypes = response;
    }, error => this.logGenericError("getConnectorType"));

    this.typeService.getRequirementType(this.authKey).subscribe((response: RequirementTypes) => {
      this.logRequest("getRequirementType", true, JSON.stringify(response));
      this.requirementTypes = response;
    }, error => this.logGenericError("getRequirementType"));

    this.typeService.getPlugin(this.authKey).subscribe((response: Array<PluginType>) => {
      this.logRequest("getPlugin", true, JSON.stringify(response));
      this.pluginTypes = response;
    }, error => this.logGenericError("getPlugin"));
  }

  logRequest(command: string, lastRequestSuccessful: boolean, resultMessage: string) {
    this.lastRequestCommand = command;
    this.lastRequestSuccessful = lastRequestSuccessful;
    this.lastRequestMessage = resultMessage;
  }

  logResultMessage(command: string, result: ResultMessage) {
    this.logRequest(command, result.success, result.message);
  }

  logGenericError(command: string) {
    this.logRequest(command, false, "");
  }

  login(password: string) {
    this.configService.postLogin({password: password}).subscribe((response: ResultMessage) => {
      this.logResultMessage("postLogin", response);
      if (response.success) {
        this.authKey = response.message;
        this.lastPassword = password;
      }
      this.reloadEverything(!response.success);
      this.handleEvents(true);
    }, error => {
      this.logGenericError("postLogin");
      this.reloadEverything(true);
    });
  }

  handleEvents(start: boolean) {
    if (!("EventSource" in window)) {
      console.warn("Event source is not supported");
      return;
    }

    if (start) {
      if (!this.eventsStarted) {
        //todo find a better way to get the basePath
        this.eventSource = new EventSource(`${this.configService["basePath"]}/events?authKey=${this.authKey}`);
        this.eventSource.onerror = () => {
          console.log("Lost connection. Trying to reconnect...");
          this.eventsStarted = false;
          setTimeout(() => this.login(this.lastPassword), 1000);
        };
        this.eventSource.addEventListener("instance", (e: MessageEvent) => {
          const { name, action, data } = JSON.parse(e.data) as { name: string, action: string, data?: { message: string, timestamp: string } };
          const instance = this.pluginInstances.find(i => i.instanceName === name);
          if (!instance)
            return;
          
          switch (action) {
            case "start":
              instance.isRunning = true;
              break;
            case "stop":
              instance.isRunning = false;
              break;
            case "log":
              if (data) {
                if (!instance.log)
                  instance.log = [];
                
                instance.log.push(`${new Date(data.timestamp).toLocaleTimeString()} - ${data.message}`);
                if (name === this.instanceNameSSValue) {
                  this.instanceLogOutput = instance.log;
                  if (this.instanceLog && this.instanceLog.nativeElement) {
                    const element = this.instanceLog.nativeElement;
                    if (element.scrollTop + element.clientHeight === element.scrollHeight)
                      setTimeout(() => element.scrollTop = element.scrollHeight, 0);
                  }
                } else if (this.instanceLogOutput === instance.log) {
                  this.instanceLogOutput = [];
                }
              }
              break;
          }
        });
        this.eventSource.addEventListener("close", () => {
          this.eventSource.close();
          this.eventSource = null;
          this.eventsStarted = false;
        });
        this.eventsStarted = true;
      }
    } else {
      if (this.eventSource) {
        this.eventSource.close();
      }
      this.eventsStarted = false;
    }
  }

  register(password: string) {
    this.configService.postRegister({password: password}).subscribe((response: ResultMessage) => {
      this.logResultMessage("postRegister", response);
      if (response.success) {
        this.authKey = response.message;
        this.reloadEverything(false);
      }
      this.reloadEverything(!response.success);
      this.handleEvents(true);
    }, error => {
      this.logGenericError("postRegister");
      this.reloadEverything(true);
    });
  }

  getRequirementImpl(apiType: string) {
    this.typeService.getReqImpl(apiType, this.authKey).subscribe((response: APIAndSpecificType) => {
      this.logRequest("getReqImpl", response.found, JSON.stringify(response));
    }, error => this.logGenericError("getReqImpl"));
  }

  getSubTypes(apiType: string) {
    this.typeService.getSubTypes(apiType, this.authKey).subscribe((response: SubTypes) => {
      this.logRequest("getSubTypes", response.subtypes.length > 0, JSON.stringify(response));
    }, error => this.logGenericError("getSubTypes"))
  }

  getRegisteredConnectors() {
    this.connectorKeys = [];
    this.connectorService.getConnectors(this.authKey).subscribe((response: Array<ConnectorKey>) => {
      this.logRequest("getConnectors", true, JSON.stringify(response));
      this.connectorKeys = response;
    }, error => this.logGenericError("getConnectors"));
  }

  manageConnectorGET(sourceIdentifier: string, connectorType: string) {
    this.connectorService.getConnector(connectorType, sourceIdentifier, this.authKey).subscribe((response: ConnectorDetails) => {
      this.logRequest("getConnector", response.found, JSON.stringify(response));
    }, error => this.logGenericError("getConnector"));
  }

  manageConnectorPOST(sourceIdentifier: string, connectorType: string) {
    let connectorRef: ConnectorRef = {
      sourceIdentifier: sourceIdentifier,
      uniqueTypeString: connectorType
    };
    this.connectorService.postConnector(connectorRef, this.authKey).subscribe((response: ResultMessage) => {
      this.logResultMessage("postConnector", response);

      if (response.success) {
        this.getRegisteredConnectors();
      }
    }, error => this.logGenericError("postConnector"));
  }

  manageConnectorDELETE(sourceIdentifier: string, connectorType: string) {
    this.connectorService.deleteConnector(connectorType, sourceIdentifier, this.authKey).subscribe((response: ResultMessage) => {
      this.logResultMessage("deleteConnector", response);

      if (response.success) {
        this.getRegisteredConnectors();
      }
    }, error => this.logGenericError("deleteConnector"));
  }

  manageCredentialsGET(sourceIdentifier: string, connectorType: string, key: string) {
    this.connectorService.getCredentialsEntry(key, connectorType, sourceIdentifier, this.authKey).subscribe((response: CredentialsEntry) => {
      let encryptedResponse = response;
      encryptedResponse.value = this.cryptoService.decrypt(response.value, this.authKey);

      if (!response.found) {
        this.logRequest("getCredentialsEntry", false, "");
      } else if (encryptedResponse.value === null) {
        this.logRequest("getCredentialsEntry", false, "Wrong auth key.");
      } else {
        this.logRequest("getCredentialsEntry", true, JSON.stringify(encryptedResponse));
      }

    }, error => this.logGenericError("getCredentialsEntry"));
  }

  manageCredentialsPOST(sourceIdentifier: string, connectorType: string, key: string, value: string) {
    let encryptedValue = this.cryptoService.encrypt(value, this.authKey);

    let kvPair: EncryptedKeyValuePair = {
      key: key,
      value: encryptedValue
    };

    this.connectorService.postCredentialsEntry(kvPair, connectorType, sourceIdentifier, this.authKey).subscribe((response: ResultMessage) => {
      this.logResultMessage("postCredentialsEntry", response);
    }, error => this.logGenericError("postCredentialsEntry"));
  }

  manageCredentialsDELETE(sourceIdentifier: string, connectorType: string, key: string) {
    this.connectorService.deleteCredentialsEntry(key, connectorType, sourceIdentifier, this.authKey).subscribe(
      (response: ResultMessage) => {
        this.logResultMessage("deleteCredentialsEntry", response);
      }, error => this.logGenericError("deleteCredentialsEntry"));
  }

  copyConnectorData(connectorKey: ConnectorKey) {
    this.mcSourceIdentifierValue = connectorKey.sourceIdentifier;
    this.mcrSourceIdentifierValue = connectorKey.sourceIdentifier;
    this.mcConnectorTypeValue = connectorKey.qualifiedConnectorType;
    this.mcrConnectorTypeValue = connectorKey.qualifiedConnectorType;
  }

  getInstances() {
    this.pluginInstances = [];
    this.instanceService.getInstances(this.authKey).subscribe((response: Array<PluginInstance>) => {
      this.pluginInstances = response;
      this.logRequest("getInstances", true, JSON.stringify(response));
    }, error => this.logGenericError("getInstances"));
  }

  startPlugin(instanceName: string) {
    this.instanceService.startInstance({instanceName: instanceName}, this.authKey).subscribe((response: ResultMessage) => {
      this.logResultMessage("startInstance", response);

      if (response.success) {
        this.getInstances();
      }
    }, error => this.logGenericError("startInstance"));
  }

  stopPlugin(instanceName: string) {
    this.instanceService.stopInstance({instanceName: instanceName}, this.authKey).subscribe((response: ResultMessage) => {
      this.logResultMessage("stopInstance", response);

      if (response.success) {
        this.getInstances();
      }
    }, error => this.logGenericError("stopInstance"));
  }

  getLog(instanceName: string) {
    this.instanceService.getLog(instanceName, this.authKey).subscribe((response: Array<PluginLogMessageDTO>) => {
      this.logRequest("getLog", true, JSON.stringify(response));
      this.instanceLogOutput = response.map(entry => `${entry.message} (${entry.timestamp})`);
    }, error => this.logGenericError("getLog"));
  }

  createPluginInstance(instanceName: string, pluginName: string, pluginAuthor: string) {
    let instanceRef: PluginInstanceRef = {
      instanceName: instanceName,
      pluginName: pluginName,
      pluginAuthor: pluginAuthor
    };

    this.instanceService.postInstance(instanceRef, this.authKey).subscribe((response: ResultMessage) => {
      this.logResultMessage("postInstance", response);
      if (response.success) {
        this.getInstances();
      }
    }, error => this.logGenericError("postInstance"));
  }

  deletePluginInstance(instanceName: string) {
    this.instanceService.deleteInstance(instanceName, this.authKey).subscribe((response: ResultMessage) => {
      this.logResultMessage("deleteInstance", response);
      if (response.success) {
        this.getInstances();
      }
    }, error => this.logGenericError("deleteInstance"));
  }

  getRequirements(instanceName: string) {
    this.instanceService.getRequirements(instanceName, this.authKey).subscribe((response: Array<Requirement>) => {
      this.instanceRequirements = response;
      this.logRequest("getRequirements", true, JSON.stringify(response));
    }, error => this.logGenericError("getRequirements"));
  }

  setRequirement(instanceName: string, requirementId: string, targetType: string, value: string) {
    let info: RequirementInfo = {
      targetType: targetType,
      value: value
    };

    this.instanceService.putRequirement(info, requirementId, instanceName, this.authKey).subscribe((response: ResultMessage) => {
      this.logResultMessage("putRequirement", response);
    }, error => this.logGenericError("putRequirement"));
  }

  removeRequirement(instanceName: string, requirementId: string) {
    this.instanceService.deleteRequirement(requirementId, instanceName, this.authKey).subscribe((response: ResultMessage) => {
      this.logResultMessage("deleteRequirement", response);
    }, error => this.logGenericError("deleteRequirement"));
  }

  copyInstanceData(instance: PluginInstance) {
    this.instanceNameSSValue = instance.instanceName;
    this.miPluginNameValue = instance.pluginName;
    this.miPluginAuthorValue = instance.pluginAuthor;
    this.miInstanceNameValue = instance.instanceName;
    this.requirementsInstanceNameValue = instance.instanceName;
  }

  copyRequirementData(requirement: Requirement, instanceName: string) {
    this.changeReqInstanceNameValue = instanceName;
    this.changeReqIDValue = requirement.uniqueRequirementId;
    this.changeReqTypeValue = requirement.targetType;
    this.changeReqValueValue = requirement.value;
  }

}

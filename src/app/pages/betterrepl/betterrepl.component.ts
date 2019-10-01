import {Component, ElementRef, HostBinding, ViewChild} from "@angular/core";
import {UpgradableComponent} from "theme/components/upgradable";
import {
  APIAndSpecificType,
  ConfigService,
  ConnectorDetails,
  ConnectorKey,
  ConnectorMetadata,
  ConnectorRef,
  ConnectorService,
  CredentialsEntry,
  EncryptedKeyValuePair,
  InstanceService,
  PluginInstance,
  PluginInstanceRef,
  PluginLogMessageDTO,
  PluginType,
  Requirement,
  RequirementInfo,
  RequirementTypes,
  ResultMessage,
  SubTypes,
  TypeService
} from "chatoverflow-api";
import {CryptoService} from "../../../crypto.service";
import {EventService} from "../../../event.service";

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
  private connectorMetadata: Map<string, ConnectorMetadata> = new Map();
  private requirementTypes: RequirementTypes;
  private pluginTypes: Array<PluginType>;

  private connectorKeys: Array<ConnectorKey>;
  private pluginInstances: Array<PluginInstance>;

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

  constructor(private configService: ConfigService, private typeService: TypeService,
              private connectorService: ConnectorService, private instanceService: InstanceService,
              private cryptoService: CryptoService, private eventService: EventService) {
    super();

    this.addEventListeners();
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
      this.connectorMetadata = new Map();
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
    this.connectorMetadata = new Map();
    this.requirementTypes = null;
    this.pluginTypes = [];

    this.typeService.getConnectorType(this.authKey).subscribe((response: Array<string>) => {
      this.logRequest("getConnectorType", true, JSON.stringify(response));
      this.connectorTypes = response;
    }, error => this.logGenericError("getConnectorType"));

    this.typeService.getConnectorsMetadata(this.authKey).subscribe((response: { [key: string]: ConnectorMetadata }) => {
      this.logRequest("getConnectorsMetadata", true, JSON.stringify(response));

      // This converts the typescript hash map structure to a "normal" js map
      for (let key in response) {
        let allValues = response[key];
        for (let keyValue in allValues) {
          this.connectorMetadata.set(keyValue, allValues[keyValue]);

          // Setting a placeholder display name for not found metadata
          if (!this.connectorMetadata.get(keyValue).found) {
            let fakeDisplayName = keyValue.substring(keyValue.lastIndexOf(".") + 1);
            fakeDisplayName.replace("Connector", "");
            this.connectorMetadata.get(keyValue).displayName = fakeDisplayName;
          }
        }
      }
    }, error => this.logGenericError("getConnectorsMetadata"));

    this.typeService.getRequirementType(this.authKey).subscribe((response: RequirementTypes) => {
      this.logRequest("getRequirementType", true, JSON.stringify(response));
      this.requirementTypes = response;
    }, error => this.logGenericError("getRequirementType"));

    this.typeService.getPlugin(this.authKey).subscribe((response: Array<PluginType>) => {
      this.logRequest("getPlugin", true, JSON.stringify(response));
      this.pluginTypes = response;
    }, error => this.logGenericError("getPlugin"));
  }

  private scrollToLogEnd(force?: boolean) {
    if (this.instanceLog && this.instanceLog.nativeElement) {
      const element = this.instanceLog.nativeElement;
      if (force || element.scrollTop + element.clientHeight === element.scrollHeight)
        setTimeout(() => element.scrollTop = element.scrollHeight, 0);
    }
  }

  private getInstanceLog(instance: PluginInstance) {
    return instance.log ? instance.log.map(log => `${log.timestamp} - ${log.message}`) : [];
  }

  private addEventListeners() {
    this.eventService.addEventListener("error", () => {
      console.log("Lost connection. Trying to reconnect...");
      setTimeout(() => this.login(this.lastPassword), 1000);
    });

    this.eventService.addEventListener("instance", ({action, data}) => {
      const instance = this.pluginInstances.find(i => i.instanceName === data.name);
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
          if (data.message && data.timestamp) {
            if (!instance.log)
              instance.log = [];

            instance.log.push({timestamp: new Date(data.timestamp).toLocaleTimeString(), message: data.message});
            if (data.name === this.instanceNameSSValue) {
              this.instanceLogOutput = this.getInstanceLog(instance);
              this.scrollToLogEnd();
            }
          }
          break;
      }
    });
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
      if (!this.eventService.isRunning()) {
        this.eventService.start(this.authKey);
      }
    } else {
      this.eventService.close();
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
    this.instanceService.getInstances(this.authKey).subscribe((response: Array<PluginInstance>) => {
      if (this.pluginInstances) {
        response.forEach(instance => {
          const previousInstance = this.pluginInstances.find(i => i.instanceName === instance.instanceName);
          if (previousInstance)
            instance.log = previousInstance.log;
        });
      }
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
    this.instanceLogOutput = this.getInstanceLog(instance);
    this.scrollToLogEnd(true);
  }

  copyRequirementData(requirement: Requirement, instanceName: string) {
    this.changeReqInstanceNameValue = instanceName;
    this.changeReqIDValue = requirement.uniqueRequirementId;
    this.changeReqTypeValue = requirement.targetType;
    this.changeReqValueValue = requirement.value;
  }

}

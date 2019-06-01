import {Component, HostBinding} from "@angular/core";
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
  AuthKey,
  PluginInstance
} from "chatoverflow-api";
import {CryptoService} from "../../../crypto.service";

@Component({
  selector: 'better-repl',
  templateUrl: './betterrepl.component.html',
  styleUrls: ['./betterrepl.css']
})
export class BetterREPLComponent extends UpgradableComponent {
  @HostBinding('class.mdl-grid') private readonly mdlGrid = true;

  private lastRequestCommand = "...";
  private lastRequestMessage = "Please send a request to the server...";
  private lastRequestSuccessful = true;

  private authKey = "";

  private connectorTypes: Array<string>;
  private requirementTypes: RequirementTypes;
  private pluginTypes: Array<PluginType>;

  private connectorKeys: Array<ConnectorKey>;
  private pluginInstances: Array<PluginInstance>;

  private instanceLogOutput: Array<string>;

  constructor(private configService: ConfigService, private typeService: TypeService,
              private connectorService: ConnectorService, private instanceService: InstanceService,
              private cryptoService: CryptoService) {
    super();

    this.requestTypes();
  }

  requestTypes() {
    this.typeService.getConnectorType().subscribe((response: Array<string>) => {
      this.logRequest("getConnectorType", true, JSON.stringify(response));
      this.connectorTypes = response;
    }, error => this.logGenericError("getConnectorType"));

    this.typeService.getRequirementType().subscribe((response: RequirementTypes) => {
      this.logRequest("getRequirementType", true, JSON.stringify(response));
      this.requirementTypes = response
    }, error => this.logGenericError("getRequirementType"));

    this.typeService.getPlugin().subscribe((response: Array<PluginType>) => {
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
      }
    }, error => this.logGenericError("postLogin"));
  }

  register(password: string) {
    this.configService.postRegister({password: password}).subscribe((response: ResultMessage) => {
      this.logResultMessage("postRegister", response);
      if (response.success) {
        this.authKey = response.message;
      }
    }, error => this.logGenericError("postRegister"));
  }

  getRequirementImpl(apiType: string) {
    this.typeService.getReqImpl(apiType).subscribe((response: APIAndSpecificType) => {
      this.logRequest("getReqImpl", response.found, JSON.stringify(response));
    }, error => this.logGenericError("getReqImpl"));
  }

  getSubTypes(apiType: string) {
    this.typeService.getSubTypes(apiType).subscribe((response: SubTypes) => {
      this.logRequest("getSubTypes", response.subtypes.length > 0, JSON.stringify(response));
    }, error => this.logGenericError("getSubTypes"))
  }

  getRegisteredConnectors() {
    this.connectorService.getConnectors().subscribe((response: Array<ConnectorKey>) => {
      this.logRequest("getConnectors", true, JSON.stringify(response));
      this.connectorKeys = response;
    }, error => this.logGenericError("getConnectors"));
  }

  manageConnectorGET(sourceIdentifier: string, connectorType: string) {
    this.connectorService.getConnector(connectorType, sourceIdentifier).subscribe((response: ConnectorDetails) => {
      this.logRequest("getConnector", response.found, JSON.stringify(response));
    }, error => this.logGenericError("getConnector"));
  }

  manageConnectorPOST(sourceIdentifier: string, connectorType: string) {
    let connectorRef: ConnectorRef = {
      sourceIdentifier: sourceIdentifier,
      uniqueTypeString: connectorType
    };
    this.connectorService.postConnector(connectorRef).subscribe((response: ResultMessage) => {
      this.logResultMessage("postConnector", response);

      if (response.success) {
        this.getRegisteredConnectors();
      }
    }, error => this.logGenericError("postConnector"));
  }

  manageConnectorDELETE(sourceIdentifier: string, connectorType: string) {
    this.connectorService.deleteConnector(connectorType, sourceIdentifier).subscribe((response: ResultMessage) => {
      this.logResultMessage("deleteConnector", response);

      if (response.success) {
        this.getRegisteredConnectors();
      }
    }, error => this.logGenericError("deleteConnector"));
  }

  manageCredentialsGET(sourceIdentifier: string, connectorType: string, key: string) {
    this.connectorService.getCredentialsEntry(key, connectorType, sourceIdentifier).subscribe((response: CredentialsEntry) => {
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

    this.connectorService.postCredentialsEntry(kvPair, connectorType, sourceIdentifier).subscribe((response: ResultMessage) => {
      this.logResultMessage("postCredentialsEntry", response);
    }, error => this.logGenericError("postCredentialsEntry"));
  }

  manageCredentialsDELETE(sourceIdentifier: string, connectorType: string, key: string) {
    let authKeyBody: AuthKey = {
      authKey: this.authKey
    };

    // TODO: Deleting is not possible right now due to DELETE-bodies not beeing evaluated. Should be in header (always)
    this.connectorService.deleteCredentialsEntry(authKeyBody, key, connectorType, sourceIdentifier).subscribe(
      (response: ResultMessage) => {
        this.logResultMessage("deleteCredentialsEntry", response);
      }, error => this.logGenericError("deleteCredentialsEntry"));
  }

  copyConnectorData(connectorKey: ConnectorKey) {
    // TODO: Implement correctly
  }

  getInstances() {
    this.instanceService.getInstances().subscribe((response: Array<PluginInstance>) => {
      this.pluginInstances = response;
      this.logRequest("getInstances", true, JSON.stringify(response));
    }, error => this.logGenericError("getInstances"));
  }

  startPlugin(instanceName: string) {
    this.instanceService.startInstance({instanceName: instanceName}).subscribe((response: ResultMessage) => {
      this.logResultMessage("startInstance", response);

      if (response.success) {
        this.getInstances();
      }
    }, error => this.logGenericError("startInstance"));
  }

  stopPlugin(instanceName: string) {
    this.instanceService.stopInstance({instanceName: instanceName}).subscribe((response: ResultMessage) => {
      this.logResultMessage("stopInstance", response);

      if (response.success) {
        this.getInstances();
      }
    }, error => this.logGenericError("stopInstance"));
  }

  getLog(instanceName: string) {
    this.instanceService.getLog(instanceName).subscribe((response: Array<string>) => {
      this.logRequest("getLog", true, JSON.stringify(response));
      this.instanceLogOutput = response;
    }, error => this.logGenericError("getLog"));
  }

}

from ..base_execution import BaseExecution
from ...decorators.abstract_class import abstract_class
from ...decorators.abstract_method import abstract_method

@abstract_class
class BaseCampaignCreator(BaseExecution):
    # start campaign creation (must be overriden in child class)
    @abstract_method
    def start_creation(seld):
        abstract_method.override_error("start_creation")

    # initiate values
    def initiate(self, source, campaign, campaign_data):
        self.clone_configs_from(source)
        self.campaign = campaign
        self.campaign_data = campaign_data

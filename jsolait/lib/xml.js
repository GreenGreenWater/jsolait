/*
  Copyright (c) 2003-2005 Jan-Klaas Kollhof
  
  This file is part of the JavaScript o lait library(jsolait).
  
  jsolait is free software; you can redistribute it and/or modify
  it under the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation; either version 2.1 of the License, or
  (at your option) any later version.
 
  This software is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.
 
  You should have received a copy of the GNU Lesser General Public License
  along with this software; if not, write to the Free Software
  Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
*/


/**
    Provides parseXML and an importNode implementation.
    @creator                Jan-Klaas Kollhof
    @created                2003-07-10
    @lastchangedby       $LastChangedBy$
    @lastchangeddate    $Date$
*/

__version__="$Revision$";

XMLNS="http://www.w3.org/2000/xmlns/";
NSXML ="http://www.w3.org/XML/1998/namespace";
nsPrefixMap={"http://www.w3.org/2000/xmlns/" : "xmlns","http://www.w3.org/XML/1998/namespace":"xml"};

/**
    Thrown if no parser could be instanciated.
*/
class NoXMLParser extends Exception({
    /**
        Initializes the Exception.
        @param trace  The error causing the Exception.
    */
    publ __init__(trace){
        supr.__init__.call(this, "Could not create an XML parser.", trace);
    };
});
/**
    Thrown if a document could not be parsed.
*/
class ParsingFailed extends Exception({
    /**
        Initializes the Exception.
        @param xml    The xml source which could not be parsed.
        @param trace The error causing this Exception.
    */
    publ __init__(xml,trace){
         supr.__init__.call(this, "Failed parsing XML document.",trace);
        this.xml = xml;
    };
    ///The xml source which could not be parsed.
    publ xml;
});
/**
    Parses an xml document.
    @param xml     The xml text.
    @return          A DOM of the xml document.
*/
publ parseXML(xml){
    var obj=null;
    var isMoz=false;
    var isIE=false;
    var isASV=false;
    
    try{//to get Adobe's SVG parseXML
        var p=window.parseXML;
        if(p==null){
            throw "No ASV paseXML";
        }
        isASV=true;
    }catch(e){
        try{//to get the mozilla parser
            obj = new DOMParser();
            isMoz=true;
        }catch(e){
            try{//to get the MS XML parser
                obj = new ActiveXObject("Msxml2.DomDocument.4.0"); 
                isIE=true;
            }catch(e){
                try{//to get the MS XML parser
                    obj = new ActiveXObject("Msxml2.DomDocument"); 
                    isIE=true;
                }catch(e){
                    try{//to get the old MS XML parser
                        obj = new ActiveXObject("microsoft.XMLDOM"); 
                        isIE=true;
                    }catch(e){
                        throw new NoXMLParser(e);
                    }
                }
            }
        }
    }
    try{
        if(isMoz){
            obj = obj.parseFromString(xml, "text/xml");
            return obj;
        }else if(isIE){
            obj.loadXML(xml);
            return obj;
        }else if(isASV){
            return window.parseXML(xml, null);
        }
    }catch(e){
        throw new ParsingFailed(xml,e);
    }
};

/**
    DOM2 implimentation of document.importNode().
    This will import into the current document. In SVG it will create SVG nodes in HTML it will create HTML nodes....
    This might become customizable in the future.
    @param importedNode   The node to import.
    @param deep=true        Import all childNodes recursively.
    @return                      The imported Node.
*/
publ importNode(importedNode, deep){
    deep = (deep==null) ? true : deep;
    //constants from doom2
    var ELEMENT_NODE = 1;
    var ATTRIBUTE_NODE = 2;
    var TEXT_NODE = 3;
    var CDATA_SECTION_NODE = 4;
    var ENTITY_REFERENCE_NODE = 5;
    var ENTITY_NODE = 6;
    var PROCESSING_INSTRUCTION_NODE = 7;
    var COMMENT_NODE = 8;
    var DOCUMENT_NODE = 9;
    var DOCUMENT_TYPE_NODE = 10;
    var DOCUMENT_FRAGMENT_NODE = 11;
    var NOTATION_NODE = 12;
    var importChildren=function(srcNode, parent){
        if(deep){
             for(var i=0; i<srcNode.childNodes.length; i++){
                var n=importNode(srcNode.childNodes.item(i), true);
                parent.appendChild(n);
            }
        }
    };
    var node=null;
    switch(importedNode.nodeType){
        case ATTRIBUTE_NODE:
            node=document.createAttributeNS(importedNode.namespaceURI, importedNode.nodeName);
            node.value=importedNode.value;
            break;
        case DOCUMENT_FRAGMENT_NODE:
            node=document.createDocumentFragment();
            importChildren(importedNode,node);
            break;
        case ELEMENT_NODE:
            node=document.createElementNS(importedNode.namespaceURI, importedNode.tagName);
            //import all attributes
            for(var i=0; i<importedNode.attributes.length; i++){
                var attr=this.importNode(importedNode.attributes.item(i), deep);
                node.setAttributeNodeNS(attr);
            }
            importChildren(importedNode,node);
            break;
        case ENTITY_REFERENCE_NODE:
            node=importedNode;
            break;
        case PROCESSING_INSTRUCTION_NODE:
            node=document.createProcessingInstruction(importedNode.target, importedNode.data);
            break;
        case TEXT_NODE:
        case CDATA_SECTION_NODE:
        case COMMENT_NODE:
            node=document.createTextNode(importedNode.nodeValue);
            break;
        case DOCUMENT_NODE:
            //Document nodes cannot be imported.
        case DOCUMENT_TYPE_NODE:
            //DocumentType nodes cannot be imported.
        case NOTATION_NODE:
            //readonly in DOM2
        case ENTITY_NODE:
            //readonly in DOM2
            throw "not supported in DOM2";
            break;
    }
    return node;
};

var getNSPrefix = function(node, namespaceURI, nsPrefixMap){
    if(! namespaceURI){
        return "";
    }else if(nsPrefixMap[namespaceURI]){
        return nsPrefixMap[namespaceURI] + ":";
    }else if(nsPrefixMap[namespaceURI] != null){
        return nsPrefixMap[namespaceURI] + ":";
    }
    if(node.nodeType == 1){
        //check in the attributes of the node if the NS is defined.
        for(var i=0;i<node.attributes.length;i++){
            var attr =node.attributes.item(i);
            if(attr.namespaceURI == XMLNS && attr.value == namespaceURI){
                return attr.localName +":";
            }
        }
    }else{
        throw new Error("Cannot find a namespace prefix for " + namespaceURI);
    }
    
    if(node.parentNode){//try the parent node
        return getNSPrefix(node.parentNode, namespaceURI, nsPrefixMap);    
    }else{
        //todo:
        throw new Error("Cannot find a namespace prefix for " + namespaceURI);
    }
};

/**
    Turns an XML document into a String.
    @param node   The node to print.
    @return           A string containing the text for the XML.
*/
publ node2XML(node, nsPrefixMap, attrParent){
    nsPrefixMap = (nsPrefixMap == null)?{}:nsPrefixMap;
    var ELEMENT_NODE = 1;
    var ATTRIBUTE_NODE = 2;
    var TEXT_NODE = 3;
    var CDATA_SECTION_NODE = 4;
    var ENTITY_REFERENCE_NODE = 5;
    var ENTITY_NODE = 6;
    var PROCESSING_INSTRUCTION_NODE = 7;
    var COMMENT_NODE = 8;
    var DOCUMENT_NODE = 9;
    var DOCUMENT_TYPE_NODE = 10;
    var DOCUMENT_FRAGMENT_NODE = 11;
    var NOTATION_NODE = 12;
    var s="";
    switch(node.nodeType){
        case ATTRIBUTE_NODE:
            try{
                var nsprefix=getNSPrefix(attrParent, node.namespaceURI, nsPrefixMap);
            }catch(e){
                alert(node.namespaceURI + "\n" + e.message);
            }
            var localName = node.localName;
            if( typeof localName == 'undefined' ){
                localName = node.name;
            }
            if(nsprefix + localName == "xmlns:xmlns"){
                nsprefix="";
            }               
            s+=nsprefix + localName +'="' + node.value + '"';
            break;
        case DOCUMENT_NODE:
            if(node.documentElement != null){
                s+=this.node2XML(node.documentElement, nsPrefixMap);
            }
            break;
        case ELEMENT_NODE:
            s+="<" + node.tagName;
            //attributes
            for(var i=0; i<node.attributes.length; i++){
                s+=" " + this.node2XML(node.attributes.item(i), nsPrefixMap, node);
            }
            //children
            if(node.childNodes.length==0){
                s+="/>\n";
            }else{
                s+=">";
                for(var child=node.firstChild; child != null; child=child.nextSibling){
                    s+=this.node2XML(child, nsPrefixMap);
                }
                    s+="</" + node.tagName+ ">\n";
            }
            break;
        case PROCESSING_INSTRUCTION_NODE:
            s+="<?" + node.target + " " + node.data + " ?>";
            break;
        case TEXT_NODE:
            s+=node.nodeValue;
            break;
        case CDATA_SECTION_NODE:
            s+="<" +"![CDATA[" + node.nodeValue + "]" + "]>";
            break;
        case COMMENT_NODE:
            s+="<!--" + node.nodeValue + "-->";
            break;
        case ENTITY_REFERENCE_NODE:
        case DOCUMENT_FRAGMENT_NODE:
        case DOCUMENT_TYPE_NODE:
        case NOTATION_NODE:
        case ENTITY_NODE:
            throw new Exception("Nodetype(%s) not supported.".format(node.nodeType));
            break;
    }
    return s;
};
